module.exports = {
    apps: [{
        name: "lfg-places",
        script: "npm",
        args: "start -- -p 3000",
        interpreter: "bash",
        // We use a bash wrapper to source nvm before running
        interpreter_args: "-c 'source ~/.nvm/nvm.sh && nvm use 20 && node_modules/.bin/next start -p 3000'",
        // Actually, simpler approach:
        // Just point to the startup script we will create
    }]
};

// BETTER APPROACH:
// We will generate this file dynamically in the deploy script where we KNOW the nvm path.
// So this file is just a placeholder or we skip creating it locally.
