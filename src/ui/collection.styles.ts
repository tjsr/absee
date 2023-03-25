import styled from 'styled-components';

export const ComparisonElement = styled.div<{paddingLeft?: number, paddingRight?: number}>`
display: flex;
flex-wrap: wrap;
max-width: 36rem;
/* border: 1px solid #000; */
text-align: center;
/* background-color: #e1e1e1; */
align-items: center;
justify-content: center;
padding-left: ${({ paddingLeft }) => paddingLeft !== undefined ? paddingLeft : 0.5}rem;
padding-right: ${({ paddingRight }) => paddingRight !== undefined ? paddingRight : 0.5}rem;
`;
