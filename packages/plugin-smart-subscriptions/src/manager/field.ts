import { SchemaTypes } from '@giraphql/core';
import CacheNode from '../cache-node.js';
import { SubscriptionManager } from '../index.js';
import { RegisterFieldSubscriptionOptions } from '../types.js';
import BaseSubscriptionManager from './base.js';

export default class FieldSubscriptionManager<
  Types extends SchemaTypes,
> extends BaseSubscriptionManager {
  cacheNode: CacheNode<Types>;

  constructor(manager: SubscriptionManager, cacheNode: CacheNode<Types>) {
    super(manager);

    this.cacheNode = cacheNode;
  }

  register<T>(name: string, { filter, invalidateCache }: RegisterFieldSubscriptionOptions<T> = {}) {
    this.addRegistration<T>({
      name,
      filter,
      onValue: (value) => {
        if (invalidateCache) {
          invalidateCache(value);
        }

        return this.cacheNode.refetch();
      },
    });
  }
}
