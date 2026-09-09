# Automatic logos

`resolveLogo` matches names locally using the generated Simple Icons and Devicon
catalogs. `BrandLogo` renders the selected SVG through the existing `expo-image`
package on web, Android and iOS. No API key or backend change is needed.

- Simple Icons 16.29.0: https://github.com/simple-icons/simple-icons
- Devicon v2.17.0: https://github.com/devicons/devicon
- Assets are served from version-pinned jsDelivr URLs, with memory/disk caching.
- Amazon, Microsoft and OpenAI use explicitly pinned earlier Simple Icons assets
  because they are absent from the current catalog.
- Only a known icon slug is requested. User-entered names, URLs, usernames and
  credentials are never inserted into a third-party request.
- Initials appear for unknown names, while loading and on image failure. A white
  logo tile keeps dark brand marks visible in both themes.

Matching is case/spacing tolerant, preserves C/C++/C# distinctions, and supports
explicit aliases and course/account qualifiers. It deliberately avoids fuzzy or
substring matching. Unknown academic subjects (such as GS / General Studies) have
initials instead of a randomly assigned technology logo. Known platform domains
use exact hostname boundaries; paths are never used to guess a brand.

`catalog.json` is checked in so normal builds need no generation/network step.
To update it, deliberately update the pinned dependency/Devicon version, then run
`npm run logos:generate`. The catalog contains metadata only (~140 KB), not the
entire icon library. Add product-specific aliases/domains in `resolveLogo.ts`.
Run `npm run test:logos` and TypeScript/lint checks after changes.

Upstream licenses/disclaimers:
- https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md
- https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md
- https://github.com/devicons/devicon/blob/master/LICENSE

Brand marks remain owned by their respective owners. Earlier assets are retained
for identifying those services; their version is explicit to avoid silent changes.
