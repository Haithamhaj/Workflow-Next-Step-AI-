# @workflow/shared-utils

**Owns:** pure, dependency-free utilities reusable across packages — id
generation, timestamp helpers, generic `Result` types, small functional
helpers.

**Hard rule:** no domain knowledge here, no imports from any other
`@workflow/*` package. If a helper needs a domain type, it belongs in that
domain package, not here.

**Pass 1 status:** skeleton only. Utilities are added on-demand by later
passes.
