import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { flattenSemanticReturnValue, init_javascriptApplicationEvidenceSchemas, init_javascriptSemanticReturns, partialApplicationCoverage, truncatedApplicationCoverage } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { init_jsonValue, jsonObjectSchema, jsonValueSchema } from "./jsonLines-Gf10X4s1.js";

//#region dist/domain/javascript/javascriptExportReturnShapeProjection.js
var projectJavaScriptExportReturnShapes, projectReturnSites;
function init_javascriptExportReturnShapeProjection() {
	return (init_javascriptExportReturnShapeProjection = __esmMin((() => {
		init_jsonValue();
		init_javascriptApplicationEvidenceSchemas();
		init_javascriptSemanticReturns();
		projectJavaScriptExportReturnShapes = (input) => {
			if (input.link.callableId === null || input.link.exportedName === null) return null;
			const callable = input.ir.callables.find(({ callableId }) => callableId === input.link.callableId);
			if (callable === undefined) return null;
			const projection = projectReturnSites(callable);
			const projectionOmitted = projection.omittedSites + projection.omittedFields + projection.omittedCoverage;
			const semanticOmitted = callable.returnCoverage.omittedCount;
			const complete = input.baseCoverage.status === "complete" && callable.returnCoverage.status === "complete" && projectionOmitted === 0;
			const limits = input.baseCoverage.limits;
			const omitted = semanticOmitted === null ? null : semanticOmitted + projectionOmitted;
			const coverage = complete ? input.baseCoverage : projectionOmitted > 0 ? truncatedApplicationCoverage(limits, omitted) : partialApplicationCoverage(limits, omitted);
			const limitations = [
				...input.ir.limitations,
				"Return shapes are inferred from inert syntax and do not prove runtime behavior.",
				...callable.returnSites.length === 0 ? ["No direct return value was retained; runtime return behavior remains unknown."] : []
			];
			return {
				properties: jsonObjectSchema.parse({
					semantic_role: "export-return-shapes",
					module_path: input.modulePath,
					exported_name: input.link.exportedName,
					callable_id: callable.callableId,
					callable_kind: callable.kind,
					static_return_shapes: projection.shapes,
					return_shape_coverage: {
						status: callable.returnCoverage.status,
						retained_return_sites: projection.shapes.length,
						omitted_return_sites: semanticOmitted === null ? null : semanticOmitted + projection.omittedSites,
						omitted_fields: projection.omittedFields,
						omitted_property_coverage: projection.omittedCoverage,
						projection_complete: projectionOmitted === 0
					}
				}),
				range: callable.location,
				coverage,
				limitations
			};
		};
		projectReturnSites = (callable) => {
			const retainedSites = callable.returnSites;
			const shapes = retainedSites.map((site) => {
				const flattened = flattenSemanticReturnValue(site.value);
				const fields = flattened.fields.map((field) => ({
					...field,
					value: jsonValueSchema.parse(field.value)
				}));
				const propertyCoverage = flattened.propertyCoverage;
				return {
					source_range: site.location,
					value_status: site.value.status,
					fields,
					property_coverage: propertyCoverage
				};
			});
			return {
				shapes,
				omittedSites: 0,
				omittedFields: 0,
				omittedCoverage: 0
			};
		};
	})))();
}

//#endregion
export { init_javascriptExportReturnShapeProjection, projectJavaScriptExportReturnShapes };