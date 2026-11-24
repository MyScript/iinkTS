import { Application } from "typedoc"

// Reflections TypeDoc could not place under an export, pulled in by typedoc-plugin-missing-exports.
const INTERNAL_MODULE = "<internal>"

/**
 * Fails the docs build (through `treatWarningsAsErrors`) when the navigation would lie:
 * a non-exported type reached through a public signature, or an export whose group is not one of
 * `groupOrder`. An export without `@group` falls into its kind's default group (`Classes`,
 * `Type Aliases`…), which is not in `groupOrder`, so the second check covers missing tags too.
 *
 * @param {Application} app
 */
export function load(app) {
  app.on(Application.EVENT_VALIDATE_PROJECT, (project) => {
    warnOnInternalModule(app, project)
    warnOnUnlistedGroups(app, project)
  })
}

function warnOnInternalModule(app, project) {
  const internal = project.children?.find((child) => child.name === INTERNAL_MODULE)
  if (!internal?.children?.length) return
  const names = internal.children.map((child) => child.name).join(", ")
  app.logger.warn(
    `[require-group] Non-exported declarations reached the documentation: ${names}. ` +
      "Export them with a @group, or @hidden the member that references them."
  )
}

function warnOnUnlistedGroups(app, project) {
  const allowed = new Set(app.options.getValue("groupOrder"))
  for (const group of project.groups ?? []) {
    if (allowed.has(group.title)) continue
    const names = group.children.filter((child) => child.name !== INTERNAL_MODULE).map((child) => child.name)
    if (!names.length) continue
    app.logger.warn(
      `[require-group] "${group.title}" is not a group listed in typedoc.json groupOrder: ${names.join(", ")}. ` +
        "Add a @group from groupOrder (or a missing one to groupOrder)."
    )
  }
}
