// Binds NodeEnvSource + the stderr sink once per test file (the engine default is UnboundEnvSource).
// Importing the real Node entry keeps the suite on the same wiring production uses.
import '../src/node';
