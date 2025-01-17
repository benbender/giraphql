import { GraphQLScalarType } from 'graphql';
import ScalarRef from './scalar.js';

export default class BuiltinScalarRef<T, U> extends ScalarRef<T, U> {
  type;

  constructor(type: GraphQLScalarType) {
    super(type.name);

    this.type = type;
  }
}
