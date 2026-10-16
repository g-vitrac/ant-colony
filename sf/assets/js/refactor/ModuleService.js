

export const ModuleService = (() => {
    const modulePath = '/modules';
    return {
        getModule: async (moduleName) => {
            return (await fetch(`${modulePath}/${moduleName}`)).text();
        }
    }
})();
