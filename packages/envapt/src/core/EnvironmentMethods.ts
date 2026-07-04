import { determineEnvironment } from './engine';
import { EnvapterBase } from './EnvapterBase';
import { Environment } from './Environment';
import { state } from './state';

/**
 * Mixin for environment detection and checking methods
 * @internal
 */
export class EnvironmentMethods extends EnvapterBase {
    /**
     * Get the current application environment
     * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
     */
    static get environment(): Environment {
        if (state.environment === undefined) {
            determineEnvironment();
        }
        return state.environment as Environment;
    }

    /**
     * Set the application environment. Accepts either Environment enum or string value.
     * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
     */
    static set environment(env: string | Environment) {
        determineEnvironment(env);
    }

    /**
     * @see {@link EnvironmentMethods.environment}
     */
    get environment(): Environment {
        return EnvironmentMethods.environment;
    }

    /**
     * @see {@link EnvironmentMethods.environment}
     */
    set environment(env: string | Environment) {
        determineEnvironment(env);
    }

    /**
     * Check if the current environment is production
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isProduction(): boolean {
        return this.environment === Environment.Production;
    }

    /**
     * @see {@link EnvironmentMethods.isProduction}
     */
    get isProduction(): boolean {
        return EnvironmentMethods.environment === Environment.Production;
    }

    /**
     * Check if the current environment is staging
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isStaging(): boolean {
        return this.environment === Environment.Staging;
    }

    /**
     * @see {@link EnvironmentMethods.isStaging}
     */
    get isStaging(): boolean {
        return EnvironmentMethods.environment === Environment.Staging;
    }

    /**
     * Check if the current environment is development
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isDevelopment(): boolean {
        return this.environment === Environment.Development;
    }

    /**
     * @see {@link EnvironmentMethods.isDevelopment}
     */
    get isDevelopment(): boolean {
        return EnvironmentMethods.environment === Environment.Development;
    }

    /**
     * Check if the current environment is test
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isTest(): boolean {
        return this.environment === Environment.Test;
    }

    /**
     * @see {@link EnvironmentMethods.isTest}
     */
    get isTest(): boolean {
        return EnvironmentMethods.environment === Environment.Test;
    }
}
