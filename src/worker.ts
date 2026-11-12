type Collection = {
  collectionId: string;
  datasource: string;
  description: string;
  lastUpdateTime: string;
  maxElementsPerComparison: number;
  name: string;
};

type SessionData = {
  userId: string;
};

type PinpanionPin = {
  categoryIds?: number[];
  id: number | string;
  image_name: string;
  name: string;
  paxEventId?: number;
  pax_id?: number;
  setId?: number | null;
  set_id?: number | null;
  year: number;
};

type PinpanionData = {
  baseImageUrl?: string;
  events?: Array<{ id: number; name: string; subType?: string }>;
  pax?: Array<{ id: number; name: string }>;
  pins: PinpanionPin[];
  sets?: Array<{ id: number; name: string }>;
};

type Pin = {
  cssClass: string;
  id: string;
  imageUrl: string;
  name: string;
  paxId: number;
  paxName?: string;
  setId?: number;
  setName?: string;
  year: number;
};

type ComparisonElement = {
  data: Pin[];
  elementId: string;
  objects: string[];
};

type ComparisonSelection = {
  a: ComparisonElement;
  b: ComparisonElement;
  id: string;
  responseTime: string;
  userId: string;
};

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const SESSION_ID_HEADERS = ['absee.sid', 'x-session-id'];

const unavailableApiResponse = (): Response => Response.json(
  {
    error: 'The A/B See API is not available on Cloudflare yet.',
  },
  { status: 503 }
);

const getRequestIp = (request: Request): string =>
  request.headers.get('CF-Connecting-IP') ?? 'unknown';

const getSessionId = (request: Request): string | undefined => {
  for (const header of SESSION_ID_HEADERS) {
    const sessionId = request.headers.get(header);
    if (sessionId !== null && sessionId !== '') {
      return sessionId;
    }
  }

  return undefined;
};

const createSessionResponse = async (env: Env): Promise<Response> => {
  const sessionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const session: SessionData = { userId };

  await env.pinpare.batch([
    env.pinpare
      .prepare(
        `INSERT INTO "User" ("id", "email", "google_id", "display_name")
        VALUES (?1, ?2, ?3, ?4)`
      )
      .bind(userId, `anonymous+${userId}@absee.invalid`, `anonymous:${userId}`, 'Anonymous'),
    env.pinpare
      .prepare('INSERT INTO "session" ("session_id", "sess", "expire") VALUES (?1, ?2, ?3)')
      .bind(sessionId, JSON.stringify(session), expiresAt),
  ]);

  return Response.json({ sessionId });
};

const getSession = async (request: Request, env: Env): Promise<SessionData | undefined> => {
  const sessionId = getSessionId(request);
  if (sessionId === undefined) {
    return undefined;
  }

  const session = await env.pinpare
    .prepare('SELECT "sess" FROM "session" WHERE "session_id" = ?1 AND "expire" > ?2')
    .bind(sessionId, Math.floor(Date.now() / 1000))
    .first<{ sess: string }>();

  if (session === null) {
    return undefined;
  }

  try {
    const sessionData = JSON.parse(session.sess) as Partial<SessionData>;
    return typeof sessionData.userId === 'string' ? { userId: sessionData.userId } : undefined;
  } catch {
    return undefined;
  }
};

const getCollection = async (collectionId: string, env: Env): Promise<Collection | null> => env.pinpare
  .prepare(
    `SELECT
      "collectionId",
      "datasource",
      "description",
      "lastUpdateTime",
      "maxElementsPerComparison",
      "name"
    FROM "Collection"
    WHERE "collectionId" = ?1`
  )
  .bind(collectionId)
  .first<Collection>();

const collectionResponse = async (collectionId: string, env: Env): Promise<Response> => {
  const collection = await getCollection(collectionId, env);

  if (collection === null) {
    return Response.json({ error: 'Collection not found.' }, { status: 404 });
  }

  return Response.json(collection);
};

const getCssClass = (subType: string | undefined): string => {
  const cssClassBySubType: Record<string, string> = {
    PAX_AUS: 'Aus',
    PAX_EAST: 'East',
    PAX_ONLINE: 'Online',
    PAX_SOUTH: 'South',
    PAX_UNPLUGGED: 'Unplugged',
    PAX_WEST: 'West',
  };

  return subType === undefined ? 'unknown' : (cssClassBySubType[subType] ?? 'unknown');
};

const toDisplayPin = (pin: PinpanionPin, data: PinpanionData, datasource: string): Pin => {
  const sourceUrl = new URL(datasource);
  const imageName = pin.image_name.split('?')[0];
  const imagePath = imageName.includes('/') ? imageName : `imgs/${imageName}`;
  const paxId = pin.pax_id ?? pin.paxEventId ?? pin.categoryIds?.[0] ?? 0;
  const setId = pin.set_id ?? pin.setId ?? undefined;
  const event = data.events?.find((candidate) => candidate.id === pin.paxEventId);
  const pax = data.pax?.find((candidate) => candidate.id === pin.pax_id);
  const set = data.sets?.find((candidate) => candidate.id === setId);
  const output: Pin = {
    cssClass: getCssClass(event?.subType),
    id: String(pin.id),
    imageUrl: data.baseImageUrl
      ? `${data.baseImageUrl.replace(/\/$/, '')}/${imageName}`
      : new URL(imagePath, `${sourceUrl.origin}/`).toString(),
    name: pin.name,
    paxId,
    year: pin.year,
  };

  const paxName = event?.name ?? pax?.name;
  if (paxName !== undefined) {
    output.paxName = paxName;
  }

  if (setId !== undefined && set !== undefined) {
    output.setId = setId;
    output.setName = set.name;
  }

  return output;
};

const retrievePins = async (collection: Collection): Promise<Pin[]> => {
  const sourceResponse = await fetch(collection.datasource, {
    cf: {
      cacheEverything: true,
      cacheTtl: 3_600,
    },
  });
  if (!sourceResponse.ok) {
    throw new Error(`Pinpanion returned ${sourceResponse.status} for ${collection.datasource}.`);
  }

  const data = await sourceResponse.json<PinpanionData>();
  if (!Array.isArray(data.pins) || data.pins.length < collection.maxElementsPerComparison * 2) {
    throw new Error(`The Pinpanion datasource for ${collection.collectionId} does not contain enough pins.`);
  }

  return data.pins.map((pin) => toDisplayPin(pin, data, collection.datasource));
};

const getPreselectedPinGroups = (url: URL, pins: Pin[], maxElements: number): [Pin[], Pin[]] | undefined => {
  const objects = url.searchParams.get('objects');
  if (objects === null) {
    return undefined;
  }

  const groups = objects.split('~').map((group) => group.split(',').filter(Boolean));
  if (groups.length !== 2 || groups.some((group) => group.length !== maxElements)) {
    throw new Error(`The objects parameter must contain two groups of ${maxElements} pin IDs.`);
  }

  const pinsById = new Map(pins.map((pin) => [pin.id, pin]));
  const selectedIds = groups.flat();
  if (new Set(selectedIds).size !== selectedIds.length) {
    throw new Error('The objects parameter contains a duplicate pin ID.');
  }

  const selectedGroups = groups.map((group) => group.map((id) => pinsById.get(id)));
  if (selectedGroups.flat().some((pin) => pin === undefined)) {
    throw new Error('The objects parameter contains an unknown pin ID.');
  }

  return selectedGroups as [Pin[], Pin[]];
};

const getRandomPinGroups = (pins: Pin[], maxElements: number): [Pin[], Pin[]] => {
  const shuffledPins = [...pins];
  for (let index = shuffledPins.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [shuffledPins[index], shuffledPins[randomIndex]] = [shuffledPins[randomIndex], shuffledPins[index]];
  }

  return [
    shuffledPins.slice(0, maxElements),
    shuffledPins.slice(maxElements, maxElements * 2),
  ];
};

const createDatabaseId = (): number => {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return (random[0] & 0x1fffff) * 0x100000000 + random[1];
};

const storeComparison = async (
  collection: Collection,
  userId: string,
  requestIp: string,
  pinGroups: [Pin[], Pin[]],
  env: Env
): Promise<ComparisonSelection> => {
  const comparisonId = createDatabaseId();
  const elementIds = [createDatabaseId(), createDatabaseId()];
  const requestTime = new Date().toISOString();
  const comparisonElements = pinGroups.flatMap((pins, groupIndex) => pins.map((pin) => ({
    comparisonElementId: createDatabaseId(),
    elementId: elementIds[groupIndex],
    objectId: pin.id,
  })));

  await env.pinpare.batch([
    env.pinpare
      .prepare(
        `INSERT INTO "Comparison" ("id", "collectionId", "userId", "requestTime", "requestIp")
        VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(comparisonId, collection.collectionId, userId, requestTime, requestIp),
    ...comparisonElements.map((element) => env.pinpare
      .prepare(
        `INSERT INTO "ComparisonElement" ("id", "elementId", "comparisonId", "objectId")
        VALUES (?1, ?2, ?3, ?4)`
      )
      .bind(element.comparisonElementId, element.elementId, comparisonId, element.objectId)),
  ]);

  const toResponseElement = (pins: Pin[], elementId: number): ComparisonElement => ({
    data: pins,
    elementId: String(elementId),
    objects: pins.map((pin) => pin.id),
  });

  return {
    a: toResponseElement(pinGroups[0], elementIds[0]),
    b: toResponseElement(pinGroups[1], elementIds[1]),
    id: String(comparisonId),
    responseTime: requestTime,
    userId,
  };
};

const comparisonResponse = async (request: Request, url: URL, collectionId: string, env: Env): Promise<Response> => {
  const session = await getSession(request, env);
  if (session === undefined) {
    return Response.json({ error: 'A valid session is required.' }, { status: 401 });
  }

  const collection = await getCollection(collectionId, env);
  if (collection === null) {
    return Response.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const pins = await retrievePins(collection);
  const pinGroups = getPreselectedPinGroups(url, pins, collection.maxElementsPerComparison) ??
    getRandomPinGroups(pins, collection.maxElementsPerComparison);
  const comparison = await storeComparison(collection, session.userId, getRequestIp(request), pinGroups, env);

  return Response.json(comparison);
};

const submitResponse = async (request: Request, env: Env): Promise<Response> => {
  const session = await getSession(request, env);
  if (session === undefined) {
    return Response.json({ success: false }, { status: 401 });
  }

  const body = await request.json<Partial<{ comparisonId: string; selectedElementId: string }>>();
  if (!/^\d{10,19}$/.test(body.comparisonId ?? '') || !/^\d{10,19}$/.test(body.selectedElementId ?? '')) {
    return Response.json({ message: 'Invalid comparison or element ID.' }, { status: 400 });
  }

  const ownedElement = await env.pinpare
    .prepare(
      `SELECT "Comparison"."id"
      FROM "Comparison"
      INNER JOIN "ComparisonElement"
        ON "ComparisonElement"."comparisonId" = "Comparison"."id"
      WHERE "Comparison"."id" = ?1
        AND "Comparison"."userId" = ?2
        AND "ComparisonElement"."elementId" = ?3`
    )
    .bind(body.comparisonId, session.userId, body.selectedElementId)
    .first<{ id: number }>();
  if (ownedElement === null) {
    return Response.json({ success: false }, { status: 401 });
  }

  try {
    await env.pinpare
      .prepare(
        `INSERT INTO "ComparisonResponse" ("id", "selectedComparisonElementId", "comparisonId")
        VALUES (?1, ?2, ?3)`
      )
      .bind(body.comparisonId, body.selectedElementId, body.comparisonId)
      .run();
  } catch (error) {
    console.warn('Failed to store comparison response.', error);
    return Response.json({ success: false }, { status: 409 });
  }

  return Response.json({ success: true });
};

type CompletedComparison = {
  comparisonId: number;
  requestTime: string;
  selectedElementId: number;
  userId: string;
};

type StoredComparisonElement = {
  comparisonId: number;
  elementId: number;
  objectId: string;
};

type ComparisonResult = {
  elements: Array<{ data: Pin[]; elementId: string }>;
  id: string;
  requestTime: string;
  userId: string;
  winner: string;
};

const parseMaxComparisons = (url: URL): number => {
  const max = url.searchParams.get('max');
  if (max === null) {
    return 50;
  }

  if (!/^\d+$/.test(max)) {
    throw new Error('max must be a non-negative integer.');
  }

  return Math.min(Number.parseInt(max, 10), 100);
};

const recentComparisonsResponse = async (
  request: Request,
  url: URL,
  collectionId: string,
  currentUserOnly: boolean,
  env: Env
): Promise<Response> => {
  const maxComparisons = parseMaxComparisons(url);
  let userId: string | undefined;
  if (currentUserOnly) {
    const session = await getSession(request, env);
    if (session === undefined) {
      return Response.json({ error: 'A valid session is required.' }, { status: 401 });
    }
    userId = session.userId;
  }

  const collection = await getCollection(collectionId, env);
  if (collection === null) {
    return Response.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const completedQuery = userId === undefined
    ? `SELECT
      "Comparison"."id" AS "comparisonId",
      "Comparison"."requestTime" AS "requestTime",
      "Comparison"."userId" AS "userId",
      "ComparisonResponse"."selectedComparisonElementId" AS "selectedElementId"
      FROM "Comparison"
      INNER JOIN "ComparisonResponse"
        ON "ComparisonResponse"."comparisonId" = "Comparison"."id"
      WHERE "Comparison"."collectionId" = ?1
      ORDER BY "Comparison"."requestTime" DESC
      LIMIT ?2`
    : `SELECT
      "Comparison"."id" AS "comparisonId",
      "Comparison"."requestTime" AS "requestTime",
      "Comparison"."userId" AS "userId",
      "ComparisonResponse"."selectedComparisonElementId" AS "selectedElementId"
      FROM "Comparison"
      INNER JOIN "ComparisonResponse"
        ON "ComparisonResponse"."comparisonId" = "Comparison"."id"
      WHERE "Comparison"."collectionId" = ?1 AND "Comparison"."userId" = ?2
      ORDER BY "Comparison"."requestTime" DESC
      LIMIT ?3`;
  const completedStatement = env.pinpare.prepare(completedQuery);
  const completedResult = await (userId === undefined
    ? completedStatement.bind(collectionId, maxComparisons)
    : completedStatement.bind(collectionId, userId, maxComparisons)
  ).all<CompletedComparison>();
  const completedComparisons = completedResult.results;
  if (completedComparisons.length === 0) {
    return Response.json([]);
  }

  const comparisonIds = completedComparisons.map((comparison) => comparison.comparisonId);
  const elements: StoredComparisonElement[] = [];
  for (let offset = 0; offset < comparisonIds.length; offset += 100) {
    const batch = comparisonIds.slice(offset, offset + 100);
    const placeholders = batch.map((_, index) => `?${index + 1}`).join(', ');
    const elementsResult = await env.pinpare
    .prepare(
      `SELECT "comparisonId", "elementId", "objectId"
      FROM "ComparisonElement"
      WHERE "comparisonId" IN (${placeholders})
      ORDER BY "comparisonId", "elementId", "id"`
    )
    .bind(...batch)
    .all<StoredComparisonElement>();
    elements.push(...elementsResult.results);
  }
  const pins = await retrievePins(collection);
  const pinsById = new Map(pins.map((pin) => [pin.id, pin]));
  const elementsByComparisonId = new Map<number, Map<number, Pin[]>>();

  elements.forEach((element) => {
    const pin = pinsById.get(element.objectId);
    if (pin === undefined) {
      return;
    }

    const comparisonElements = elementsByComparisonId.get(element.comparisonId) ?? new Map<number, Pin[]>();
    const group = comparisonElements.get(element.elementId) ?? [];
    group.push(pin);
    comparisonElements.set(element.elementId, group);
    elementsByComparisonId.set(element.comparisonId, comparisonElements);
  });

  const response: ComparisonResult[] = completedComparisons.map((comparison) => ({
    elements: [...(elementsByComparisonId.get(comparison.comparisonId)?.entries() ?? [])].map(
      ([elementId, data]) => ({ data, elementId: String(elementId) })
    ),
    id: String(comparison.comparisonId),
    requestTime: comparison.requestTime,
    userId: comparison.userId,
    winner: String(comparison.selectedElementId),
  }));

  return Response.json(response);
};

const statsResponse = async (collectionId: string, env: Env): Promise<Response> => {
  const collection = await getCollection(collectionId, env);
  if (collection === null) {
    return Response.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const [responses, users, mostFrequent] = await env.pinpare.batch([
    env.pinpare
      .prepare(
        `SELECT COUNT(*) AS "count"
        FROM "ComparisonResponse"
        INNER JOIN "Comparison" ON "Comparison"."id" = "ComparisonResponse"."comparisonId"
        WHERE "Comparison"."collectionId" = ?1`
      )
      .bind(collectionId),
    env.pinpare
      .prepare(
        `SELECT COUNT(DISTINCT "userId") AS "count"
        FROM "Comparison"
        WHERE "collectionId" = ?1`
      )
      .bind(collectionId),
    env.pinpare
      .prepare(
        `SELECT "ComparisonElement"."objectId" AS "objectId", COUNT(*) AS "count"
        FROM "ComparisonElement"
        INNER JOIN "Comparison" ON "Comparison"."id" = "ComparisonElement"."comparisonId"
        WHERE "Comparison"."collectionId" = ?1
        GROUP BY "ComparisonElement"."objectId"
        ORDER BY "count" DESC
        LIMIT 1`
      )
      .bind(collectionId),
  ]);
  const responseCount = responses.results[0] as { count: number } | undefined;
  const userCount = users.results[0] as { count: number } | undefined;
  const mostFrequentElement = mostFrequent.results[0] as { count: number; objectId: string } | undefined;

  return Response.json({
    elementsCompared: responseCount?.count ?? 0,
    mostFrequentlyComparedElement: mostFrequentElement?.objectId,
    mostFrequentlyComparedElementCount: mostFrequentElement?.count,
    usersContributed: userCount?.count ?? 0,
  });
};

type EloRating = {
  objectId: string;
  rating: number;
};

type EloTimelineEntry = {
  collectionObjects: Pin[];
  elements: Array<{ data: Pin[]; elementId: string }>;
  eloRatingsAfter: EloRating[];
  eloRatingsBefore: EloRating[];
  id: string;
  requestTime: string;
  userId: string;
  winner: string;
};

const STARTING_ELO_RATING = 2_000;
const ELO_WIN_DELTA = 32;
const MAX_ELO_COMPARISONS = 10_000;

const getEloRating = (ratings: Map<string, number>, objectId: string): number =>
  ratings.get(objectId) ?? STARTING_ELO_RATING;

const updateEloRatings = (
  ratings: Map<string, number>,
  winningPins: Pin[],
  losingPins: Pin[]
): void => {
  const averageRating = (pins: Pin[]): number => pins.reduce(
    (total, pin) => total + getEloRating(ratings, pin.id),
    0
  ) / pins.length;
  const winningRating = averageRating(winningPins);
  const losingRating = averageRating(losingPins);
  const expectedWinningOutcome = 1 / (1 + Math.pow(10, (losingRating - winningRating) / STARTING_ELO_RATING));
  const ratingDelta = ELO_WIN_DELTA * (1 - expectedWinningOutcome);

  winningPins.forEach((pin) => ratings.set(pin.id, getEloRating(ratings, pin.id) + ratingDelta));
  losingPins.forEach((pin) => ratings.set(pin.id, getEloRating(ratings, pin.id) - ratingDelta));
};

const eloResponse = async (collectionId: string, env: Env): Promise<Response> => {
  const collection = await getCollection(collectionId, env);
  if (collection === null) {
    return Response.json({ error: 'Collection not found.' }, { status: 404 });
  }

  const completedResult = await env.pinpare
    .prepare(
      `SELECT
        "Comparison"."id" AS "comparisonId",
        "Comparison"."requestTime" AS "requestTime",
        "Comparison"."userId" AS "userId",
        "ComparisonResponse"."selectedComparisonElementId" AS "selectedElementId"
      FROM "Comparison"
      INNER JOIN "ComparisonResponse"
        ON "ComparisonResponse"."comparisonId" = "Comparison"."id"
      WHERE "Comparison"."collectionId" = ?1
      ORDER BY "Comparison"."requestTime" ASC
      LIMIT ?2`
    )
    .bind(collectionId, MAX_ELO_COMPARISONS)
    .all<CompletedComparison>();
  const completedComparisons = completedResult.results;
  if (completedComparisons.length === 0) {
    return Response.json([]);
  }

  const comparisonIds = completedComparisons.map((comparison) => comparison.comparisonId);
  const elements: StoredComparisonElement[] = [];
  for (let offset = 0; offset < comparisonIds.length; offset += 100) {
    const batch = comparisonIds.slice(offset, offset + 100);
    const placeholders = batch.map((_, index) => `?${index + 1}`).join(', ');
    const elementsResult = await env.pinpare
    .prepare(
      `SELECT "comparisonId", "elementId", "objectId"
      FROM "ComparisonElement"
      WHERE "comparisonId" IN (${placeholders})
      ORDER BY "comparisonId", "elementId", "id"`
    )
    .bind(...batch)
    .all<StoredComparisonElement>();
    elements.push(...elementsResult.results);
  }
  const pins = await retrievePins(collection);
  const pinsById = new Map(pins.map((pin) => [pin.id, pin]));
  const elementsByComparisonId = new Map<number, Map<number, Pin[]>>();

  elements.forEach((element) => {
    const pin = pinsById.get(element.objectId);
    if (pin === undefined) {
      return;
    }

    const comparisonElements = elementsByComparisonId.get(element.comparisonId) ?? new Map<number, Pin[]>();
    const group = comparisonElements.get(element.elementId) ?? [];
    group.push(pin);
    comparisonElements.set(element.elementId, group);
    elementsByComparisonId.set(element.comparisonId, comparisonElements);
  });

  const ratings = new Map<string, number>();
  const timeline: EloTimelineEntry[] = [];
  completedComparisons.forEach((comparison) => {
    const elements = [...(elementsByComparisonId.get(comparison.comparisonId)?.entries() ?? [])];
    const winningElement = elements.find(([elementId]) => elementId === comparison.selectedElementId);
    const losingElement = elements.find(([elementId]) => elementId !== comparison.selectedElementId);
    if (elements.length !== 2 || winningElement === undefined || losingElement === undefined) {
      return;
    }

    const comparisonPins = elements.flatMap(([, data]) => data);
    const eloRatingsBefore = comparisonPins.map((pin) => ({
      objectId: pin.id,
      rating: Math.round(getEloRating(ratings, pin.id)),
    }));
    updateEloRatings(ratings, winningElement[1], losingElement[1]);
    const eloRatingsAfter = comparisonPins.map((pin) => ({
      objectId: pin.id,
      rating: Math.round(getEloRating(ratings, pin.id)),
    }));

    timeline.push({
      collectionObjects: comparisonPins,
      elements: elements.map(([elementId, data]) => ({ data, elementId: String(elementId) })),
      eloRatingsAfter,
      eloRatingsBefore,
      id: String(comparison.comparisonId),
      requestTime: comparison.requestTime,
      userId: comparison.userId,
      winner: String(comparison.selectedElementId),
    });
  });

  return Response.json(timeline);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({ environment: env.ENVIRONMENT, status: 'ok' });
    }

    if (url.pathname === '/session' && request.method === 'GET') {
      try {
        return await createSessionResponse(env);
      } catch (error) {
        console.error('Failed to create session.', error);
        return Response.json({ error: 'Failed to create session.' }, { status: 500 });
      }
    }

    const apiCollectionId = url.pathname.match(/^\/api\/collections\/([^/]+)$/)?.[1];
    if (apiCollectionId !== undefined && request.method === 'GET') {
      try {
        return await collectionResponse(decodeURIComponent(apiCollectionId), env);
      } catch (error) {
        console.error('Failed to retrieve collection.', error);
        return Response.json({ error: 'Failed to retrieve collection.' }, { status: 500 });
      }
    }

    const comparisonCollectionId = url.pathname.match(/^\/collection\/([^/]+)$/)?.[1];
    if (comparisonCollectionId !== undefined && request.method === 'GET') {
      try {
        return await comparisonResponse(request, url, decodeURIComponent(comparisonCollectionId), env);
      } catch (error) {
        console.error('Failed to prepare comparison.', error);
        return Response.json({ error: 'Failed to prepare comparison.' }, { status: 500 });
      }
    }

    if (url.pathname === '/submit' && request.method === 'POST') {
      try {
        return await submitResponse(request, env);
      } catch (error) {
        console.error('Failed to submit comparison.', error);
        return Response.json({ success: false }, { status: 400 });
      }
    }

    const recentCollection = url.pathname.match(/^\/api\/recent\/([^/]+)(\/me)?$/);
    if (recentCollection !== null && request.method === 'GET') {
      try {
        return await recentComparisonsResponse(
          request,
          url,
          decodeURIComponent(recentCollection[1]),
          recentCollection[2] === '/me',
          env
        );
      } catch (error) {
        console.error('Failed to retrieve recent comparisons.', error);
        return Response.json({ error: 'Failed to retrieve recent comparisons.' }, { status: 500 });
      }
    }

    const statsCollection = url.pathname.match(/^\/api\/stats\/elementsCompared\/([^/]+)$/)?.[1];
    if (statsCollection !== undefined && request.method === 'GET') {
      try {
        return await statsResponse(decodeURIComponent(statsCollection), env);
      } catch (error) {
        console.error('Failed to retrieve collection statistics.', error);
        return Response.json({ error: 'Failed to retrieve collection statistics.' }, { status: 500 });
      }
    }

    const eloCollection = url.pathname.match(/^\/api\/elo\/([^/]+)$/)?.[1];
    if (eloCollection !== undefined && request.method === 'GET') {
      try {
        return await eloResponse(decodeURIComponent(eloCollection), env);
      } catch (error) {
        console.error('Failed to calculate Elo ratings.', error);
        return Response.json({ error: 'Failed to calculate Elo ratings.' }, { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return unavailableApiResponse();
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
