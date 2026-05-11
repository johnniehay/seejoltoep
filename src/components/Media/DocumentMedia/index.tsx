import React from 'react';
import { IconFileDescription } from '@tabler/icons-react';
import type { Props } from '../types';

export const DocumentMedia: React.FC<Props> = (props) => {
  console.log(JSON.stringify(props))
  const { className, resource, alt: propAlt } = props
  const url = typeof resource === 'object' && resource !== null && resource.url ? resource.url : ''
  const alt = propAlt ?? (typeof resource === 'object' && resource !== null && resource.alt ? resource.alt : 'Document')

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-blue-600 hover:underline">
        <IconFileDescription size={64} className="text-blue-500" />
        <span className="mt-2 text-center">{alt}</span>
      </a>
    </div>
  );
};
