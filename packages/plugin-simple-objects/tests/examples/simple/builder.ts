import SchemaBuilder from '@giraphql/core';
import SimpleObjectsPlugin from '../../../src/index.js';
import { ContextType } from './types';

interface Types {
  Context: ContextType;
  Scalars: {
    ID: {
      Input: string;
      Output: number | string;
    };
  };
}

export default new SchemaBuilder<Types>({
  plugins: [SimpleObjectsPlugin],
});
