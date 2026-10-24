export const budgetAIService={prepareExport:async(p)=>({version:1,generatedAt:new Date().toISOString(),payload:p}),track(){},validate(e)=>({ok:!!e,errors:e?[]:['required']})};
export default budgetAIService;
