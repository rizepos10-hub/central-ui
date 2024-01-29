import React from 'react';

interface Props {
  children?: string;
  maxLength?: number;
}
export const SummarizeText = ({ children, maxLength = 50 }:Props)=>{
  let summarized = children;
  if (children?.length > maxLength) summarized = children.slice(0, maxLength-1) + "...";
  return <>{summarized}</>
}
