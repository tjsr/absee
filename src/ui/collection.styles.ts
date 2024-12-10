import { styled } from 'styled-components';

export const ComparisonElement = styled.div<
  {paddingLeft?: number, paddingRight?: number, isHighlighted?: boolean, selectGlowColor?: string }
>`
display: inline-flex;
flex-wrap: wrap;
max-width: 36rem;
border: 1px solid #000;
text-align: center;
background-color: #e1e1e1;
align-items: center;
justify-content: space-evenly;
margin: auto;
padding-left: ${({ paddingLeft }) => paddingLeft !== undefined ? paddingLeft : 0.5}rem;
padding-right: ${({ paddingRight }) => paddingRight !== undefined ? paddingRight : 0.5}rem;
${({ isHighlighted, selectGlowColor }) => isHighlighted
    ? `boxShadow: 0px 0px 40px 20px ${selectGlowColor ?? '#0f3'};` : ''}
`;

// const makeGlow = (ref: MutableRefObject<HTMLDivElement | null>): void => {
//   if (ref && ref.current) {
//     ref.current.style.boxShadow = '0px 0px 40px 20px ' + selectGlowColor;
//     ref.current.style.backgroundColor = selectBackgroundColor;
//     /* in order: x offset, y offset, blur size, spread size, color */
//     /* blur size and spread size are optional (they default to 0) */
//   }
// };
