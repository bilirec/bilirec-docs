import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/** Point the header brand logo at the marketing homepage, not the docs locale root. */
export const onRequest = defineRouteMiddleware((context) => {
	context.locals.starlightRoute.siteTitleHref = '/';
});
