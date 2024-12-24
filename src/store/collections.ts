import { Collection, PrismaClient } from "@prisma/client";

export interface CollectionDataSource<CollectionObjectType> {
  getAll(): Promise<CollectionObjectType[]>;
  getById(id: string): Promise<CollectionObjectType | null>;
}

export class CollectionPrismaDataSource implements CollectionDataSource<Collection> {
  _prisma: PrismaClient;
  constructor(client: PrismaClient) {
    this._prisma = client;
  }

  async getAll(): Promise<Collection[]> {
    return this._prisma.collection.findMany();
  }

  async getById(id: string): Promise<Collection|null> {
    return this._prisma.collection.findUnique({
      where: {
        collectionId: id,
      },
    });
  }
}
