

export const ModuleService = (() => {
    const modulePath = 'public/js/refactor/antColony/modules';    
    return {
        getModule: async (moduleName) => {
            return (await fetch(`${modulePath}/${moduleName}.wgsl`)).text();
        }
    }
})();