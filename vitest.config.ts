import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        testTimeout: 500,
        coverage: {
            enabled: true,
            provider: "v8",
            reporter: ["json", "html"],
            include: ["src"]
        }
    },
    mode: undefined
})
