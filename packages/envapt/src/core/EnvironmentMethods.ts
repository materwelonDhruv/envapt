import { determineEnvironment, setEnvironment } from './engine';
import { EnvapterBase } from './EnvapterBase';
import { Environment } from './Environment';
import { state } from './state';

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
     * Set the application environment to an {@link Environment} value such as `'production'`, matched
     * case-insensitively. An unknown name selects `'development'`. Setting it reloads the `.env` files
     * for that environment.
     * @see {@link https://envapt.materwelon.dev/docs/environment#detecting-the-environment}
     */
    // string & {} keeps the four names in editor suggestions
    static set environment(env: Environment | (string & {})) {
        setEnvironment(env);
    }

    /**
     * Check if the current environment is production
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isProduction(): boolean {
        return this.environment === Environment.Production;
    }

    /**
     * Check if the current environment is staging
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isStaging(): boolean {
        return this.environment === Environment.Staging;
    }

    /**
     * Check if the current environment is development
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isDevelopment(): boolean {
        return this.environment === Environment.Development;
    }

    /**
     * Check if the current environment is test
     * @see {@link https://envapt.materwelon.dev/docs/environment#branching-on-the-environment}
     */
    static get isTest(): boolean {
        return this.environment === Environment.Test;
    }
}
