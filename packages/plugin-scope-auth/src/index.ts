import SchemaBuilder, {
  BasePlugin,
  GiraphQLInterfaceTypeConfig,
  GiraphQLMutationTypeConfig,
  GiraphQLObjectTypeConfig,
  GiraphQLOutputFieldConfig,
  GiraphQLQueryTypeConfig,
  GiraphQLSubscriptionTypeConfig,
  SchemaTypes,
} from '@giraphql/core';
import { GraphQLFieldResolver } from 'graphql';
import './global-types';
import { resolveHelper } from './resolve-helper';
import {
  createFieldAuthScopesStep,
  createFieldGrantScopesStep,
  createResolveStep,
  createTypeAuthScopesStep,
  createTypeGrantScopesStep,
} from './steps';
import { ResolveStep, TypeAuthScopes, TypeGrantScopes } from './types';

export * from './types';

export default class ScopeAuthPlugin<Types extends SchemaTypes> extends BasePlugin<Types> {
  name: 'GiraphQLScopeAuth' = 'GiraphQLScopeAuth';

  wrapResolve(
    resolver: GraphQLFieldResolver<unknown, Types['Context'], object>,
    fieldConfig: GiraphQLOutputFieldConfig<Types>,
    buildOptions: GiraphQLSchemaTypes.BuildSchemaOptions<Types>,
  ): GraphQLFieldResolver<unknown, Types['Context'], object> {
    if (buildOptions.disableScopeAuth) {
      return resolver;
    }

    const typeConfig = this.configStore.getTypeConfig(fieldConfig.parentType);

    if (typeConfig.graphqlKind !== 'Object' && typeConfig.graphqlKind !== 'Interface') {
      throw new Error(
        `Got fields for ${fieldConfig.parentType} which is a ${typeConfig.graphqlKind} which cannot have fields`,
      );
    }

    const steps = this.createResolveSteps(fieldConfig, typeConfig, resolver);

    if (steps.length > 1) {
      return resolveHelper(steps, this);
    }

    return resolver;
  }

  createResolveSteps(
    fieldConfig: GiraphQLOutputFieldConfig<Types>,
    typeConfig:
      | GiraphQLObjectTypeConfig
      | GiraphQLInterfaceTypeConfig
      | GiraphQLQueryTypeConfig
      | GiraphQLMutationTypeConfig
      | GiraphQLSubscriptionTypeConfig,
    resolver: GraphQLFieldResolver<unknown, Types['Context'], object>,
  ): ResolveStep<Types>[] {
    const parentAuthScope = typeConfig.giraphqlOptions.authScopes;
    const parentGrantScopes = typeConfig.giraphqlOptions.grantScopes;
    const fieldAuthScopes = fieldConfig.giraphqlOptions.authScopes;
    const fieldGrantScopes = fieldConfig.giraphqlOptions.grantScopes;

    const interfaceConfigs =
      typeConfig.kind === 'Object' || typeConfig.kind === 'Interface'
        ? typeConfig.interfaces.map((iface) =>
            this.configStore.getTypeConfig(iface.name, 'Interface'),
          )
        : [];

    const steps: ResolveStep<Types>[] = [];

    if (parentAuthScope && !fieldConfig.giraphqlOptions.skipTypeScopes) {
      steps.push(
        createTypeAuthScopesStep(
          parentAuthScope as TypeAuthScopes<Types, unknown>,
          typeConfig.name,
        ),
      );
    }

    if (
      !(fieldConfig.kind === 'Interface' || fieldConfig.kind === 'Object') ||
      !fieldConfig.giraphqlOptions.skipInterfaceScopes
    ) {
      interfaceConfigs.forEach((interfaceConfig) => {
        if (interfaceConfig.giraphqlOptions.authScopes) {
          steps.push(
            createTypeAuthScopesStep(
              interfaceConfig.giraphqlOptions.authScopes as TypeAuthScopes<Types, unknown>,
              interfaceConfig.name,
            ),
          );
        }
      });
    }

    if (parentGrantScopes) {
      steps.push(
        createTypeGrantScopesStep(
          parentGrantScopes as TypeGrantScopes<Types, unknown>,
          typeConfig.name,
        ),
      );
    }

    interfaceConfigs.forEach((interfaceConfig) => {
      if (interfaceConfig.giraphqlOptions.grantScopes) {
        steps.push(
          createTypeGrantScopesStep(
            interfaceConfig.giraphqlOptions.grantScopes as TypeGrantScopes<Types, unknown>,
            interfaceConfig.name,
          ),
        );
      }
    });

    if (fieldAuthScopes) {
      steps.push(createFieldAuthScopesStep(fieldAuthScopes));
    }

    steps.push(createResolveStep(resolver));

    if (fieldGrantScopes) {
      steps.push(createFieldGrantScopesStep(fieldGrantScopes));
    }

    return steps;
  }
}

SchemaBuilder.registerPlugin('GiraphQLScopeAuth', ScopeAuthPlugin);