import {
  Children,
  isValidElement,
  Suspense,
  type ReactElement,
  type ReactNode,
} from 'react'
import type { CmsComponent, CmsSlotProps } from './cms.types'
import { getSlotByPosition, getSlotComponents } from './cms.helpers'
import { useCmsComponentMapping } from './useCmsComponentMapping'
import { CmsOutlet } from './CmsOutlet'

/**
 * Extracts CmsOutlet children grouped by position, and any non-outlet children.
 */
interface ParsedOutlets {
  before: ReactNode[]
  after: ReactNode[]
  replace: ReactNode | undefined
}

function parseOutlets(children: ReactNode): ParsedOutlets {
  const result: ParsedOutlets = { before: [], after: [], replace: undefined }

  // eslint-disable-next-line @eslint-react/no-children-for-each -- intentional: parsing CmsOutlet marker children by component identity
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== CmsOutlet) return

    const props = child.props as { position: string; children: ReactNode }
    switch (props.position) {
      case 'before':
        result.before.push(props.children)
        break
      case 'after':
        result.after.push(props.children)
        break
      case 'replace':
        result.replace = props.children
        break
    }
  })

  return result
}

/**
 * Structural rendering component that renders CMS components within a named slot.
 *
 * Resolves the slot's components from page data or a direct `components` prop,
 * looks up each component in the `SapccConfig` component mapping by `typeCode`,
 * and wraps each in an individual `<Suspense>` boundary to support `React.lazy()`.
 *
 * Use `<CmsOutlet>` children to inject custom content before, after, or in
 * place of the CMS components.
 *
 * @example Basic usage:
 * ```tsx
 * <CmsSlot name="Section1" page={page} />
 * ```
 *
 * @example With custom outlets:
 * ```tsx
 * <CmsSlot name="Header" page={page}>
 *   <CmsOutlet position="before"><AnnouncementBanner /></CmsOutlet>
 *   <CmsOutlet position="after"><PromoStrip /></CmsOutlet>
 * </CmsSlot>
 * ```
 *
 * @example With direct components:
 * ```tsx
 * <CmsSlot name="custom" components={myComponents} />
 * ```
 */
export function CmsSlot({
  name,
  page,
  components: componentsProp,
  suspenseFallback = null,
  className,
  children,
}: CmsSlotProps): ReactElement | null {
  const { getComponent, fallbackComponent } = useCmsComponentMapping()

  // Resolve components: from direct prop or by extracting from page data
  let resolvedComponents: CmsComponent[] = []
  if (componentsProp) {
    resolvedComponents = componentsProp
  } else if (page) {
    const slot = getSlotByPosition(page, name)
    if (slot) {
      resolvedComponents = getSlotComponents(slot)
    }
  }

  // Parse CmsOutlet children
  const outlets = children ? parseOutlets(children) : undefined

  // If a "replace" outlet is present, render it instead of CMS components
  if (outlets?.replace !== undefined) {
    return <div className={className} data-cms-slot={name}>{outlets.replace}</div>
  }

  // Render CMS components with mapping lookup
  const renderedComponents: ReactNode[] = []
  for (const component of resolvedComponents) {
    const typeCode = component.typeCode ?? ''
    const Resolved = getComponent(typeCode) ?? fallbackComponent
    if (!Resolved) continue

    const key = component.uid ?? typeCode
    renderedComponents.push(
      <Suspense key={key} fallback={suspenseFallback}>
        <Resolved data={component} slot={name} />
      </Suspense>,
    )
  }

  // If nothing to render and no outlets, return null
  if (
    renderedComponents.length === 0 &&
    (!outlets || (outlets.before.length === 0 && outlets.after.length === 0))
  ) {
    return null
  }

  return (
    <div className={className} data-cms-slot={name}>
      {outlets?.before}
      {renderedComponents}
      {outlets?.after}
    </div>
  )
}
