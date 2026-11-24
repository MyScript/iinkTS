import type { Reporter } from "@playwright/test/reporter"

import { formatReport, readRunReports, runId } from "./lib/reportFile.ts"

/**
 * Prints one before/after table per project once the whole run is over — after every worker has
 * merged its scenarios into the report file, including the workers that replaced a failed one.
 */
export default class ABReporter implements Reporter {
  printsToStdio(): boolean {
    return false
  }

  onEnd(): void {
    for (const { file, report } of readRunReports(runId())) {
      console.log(`\n${formatReport(report)}\n\nreport written to ${file}`)
    }
  }
}
