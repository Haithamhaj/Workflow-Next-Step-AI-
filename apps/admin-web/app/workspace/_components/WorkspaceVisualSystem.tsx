import type { ReactNode } from "react";
import type { WorkspaceDictionary } from "../_i18n";
import styles from "../workspace.module.css";

type StatusKey = keyof WorkspaceDictionary["visual"]["status"];
type PageVisualKey = "sources" | "hierarchy" | "targeting" | "evidence" | "analysis" | "prompts" | "package";

export function WorkspaceStatusPill({
  dictionary,
  status,
}: {
  dictionary: WorkspaceDictionary;
  status: StatusKey;
}) {
  return (
    <span className={`${styles.workspaceStatusPill} ${styles[`workspaceStatus_${status}`]}`}>
      {dictionary.visual.status[status]}
    </span>
  );
}

export function WorkspacePanel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={styles.workspacePanel} aria-label={title}>
      <div className={styles.workspacePanelHeader}>
        <div>
          <h3 className={styles.workspacePanelTitle}>{title}</h3>
          {description ? <p className={styles.workspacePanelDescription}>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PriorityActionBanner({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <section className={styles.workspacePriorityBanner} aria-label={dictionary.visual.priority.urgency}>
      <div>
        <WorkspaceStatusPill dictionary={dictionary} status="needsReview" />
        <h3>{dictionary.visual.priority.title}</h3>
        <p>{dictionary.visual.priority.explanation}</p>
      </div>
      <button className={styles.workspaceStaticAction} type="button" disabled>
        {dictionary.visual.priority.actionLabel}
      </button>
    </section>
  );
}

export function StageJourneyMap({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <WorkspacePanel
      title={dictionary.visual.stageJourneyTitle}
      description={dictionary.visual.stageJourneyDescription}
    >
      <div className={styles.workspaceJourneyMap}>
        {dictionary.visual.stages.map((stage) => (
          <StageJourneyCard
            key={stage.number}
            dictionary={dictionary}
            number={stage.number}
            label={stage.label}
            purpose={stage.purpose}
            hint={stage.hint}
            status={stage.status}
            active={stage.status === "blocked"}
          />
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function StageJourneyCard({
  dictionary,
  number,
  label,
  purpose,
  hint,
  status,
  active = false,
}: {
  dictionary: WorkspaceDictionary;
  number: string;
  label: string;
  purpose: string;
  hint: string;
  status: StatusKey;
  active?: boolean;
}) {
  return (
    <article className={`${styles.workspaceJourneyCard} ${active ? styles.workspaceJourneyCardActive : ""}`}>
      <div className={styles.workspaceStageNumber}>{number}</div>
      <div className={styles.workspaceJourneyBody}>
        <div className={styles.workspaceJourneyTopline}>
          <h4>{label}</h4>
          <WorkspaceStatusPill dictionary={dictionary} status={status} />
        </div>
        <p>{purpose}</p>
        <span>{hint}</span>
      </div>
    </article>
  );
}

export function EvidenceMetricRow({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <div className={styles.workspaceMetricGrid}>
      {dictionary.visual.evidenceMetrics.map((metric) => (
        <article key={metric.label} className={styles.workspaceMetricCard}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </div>
  );
}

export function ReviewIssueList({
  dictionary,
  limit,
}: {
  dictionary: WorkspaceDictionary;
  limit?: number;
}) {
  const issues = typeof limit === "number" ? dictionary.visual.reviewIssues.slice(0, limit) : dictionary.visual.reviewIssues;

  return (
    <WorkspacePanel title={dictionary.visual.reviewIssuesTitle}>
      <div className={styles.workspaceReviewGrid}>
        {issues.map((issue) => (
          <article key={issue.title} className={styles.workspaceReviewIssue}>
            <div className={styles.workspaceJourneyTopline}>
              <h4>{issue.title}</h4>
              <WorkspaceStatusPill dictionary={dictionary} status={issue.status} />
            </div>
            <p>{issue.why}</p>
            <dl className={styles.workspaceIssueFacts}>
              <div>
                <dt>{issue.boundary}</dt>
                <dd>{issue.impact}</dd>
              </div>
              <div>
                <dt>{dictionary.visual.actions.reviewEvidence}</dt>
                <dd>{issue.action}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function TruthBoundaryCard({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <section className={styles.workspaceTruthCard} aria-label={dictionary.visual.truthBoundaryTitle}>
      <h3>{dictionary.visual.truthBoundaryTitle}</h3>
      <ul>
        {dictionary.visual.truthBoundaries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function PackageReadinessStrip({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <WorkspacePanel title={dictionary.visual.packageReadinessTitle} description={dictionary.visual.packageReminder}>
      <div className={styles.workspaceReadinessStrip}>
        {dictionary.visual.packageReadiness.map((item) => (
          <div key={item.label} className={styles.workspaceReadinessStep}>
            <span>{item.label}</span>
            <WorkspaceStatusPill dictionary={dictionary} status={item.status} />
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function MethodLensGrid({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <WorkspacePanel title={dictionary.visual.methodsTitle} description={dictionary.visual.methodsReminder}>
      <div className={styles.workspaceMethodGrid}>
        {dictionary.visual.methods.map((method) => (
          <article key={method.title} className={styles.workspaceMethodCard}>
            <h4>{method.title}</h4>
            <p>{method.detail}</p>
          </article>
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function DepartmentRoleInterfaceMap({ dictionary, compact = false }: { dictionary: WorkspaceDictionary; compact?: boolean }) {
  const nodes = dictionary.visual.departmentMap.nodes;

  return (
    <WorkspacePanel
      title={dictionary.visual.departmentMap.title}
      description={dictionary.visual.departmentMap.label}
    >
      <div className={`${styles.workspaceDepartmentMap} ${compact ? styles.workspaceDepartmentMapCompact : ""}`}>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeInternal} ${styles.workspaceNodeScope}`}>
          {nodes.manager}
          <span>{dictionary.visual.departmentMap.legend.scope}</span>
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeInternal}`}>
          {nodes.supervisor}
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeInternal} ${styles.workspaceNodeValidation}`}>
          {nodes.executive}
          <span>{dictionary.visual.departmentMap.legend.validation}</span>
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeExternal} ${styles.workspaceNodeSignal}`}>
          {nodes.finance}
          <span>{dictionary.visual.departmentMap.legend.signal}</span>
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeExternal}`}>
          {nodes.operations}
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeSystem}`}>
          {nodes.crm}
        </div>
        <div className={`${styles.workspaceMapNode} ${styles.workspaceNodeExternal}`}>
          {nodes.clientSuccess}
        </div>
      </div>
      <div className={styles.workspaceMapLegend}>
        {Object.values(dictionary.visual.departmentMap.legend).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <p className={styles.workspaceMapBoundary}>{dictionary.visual.departmentMap.boundary}</p>
    </WorkspacePanel>
  );
}

export function WorkflowMiniMap({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <WorkspacePanel title={dictionary.visual.workflowMiniMap.title} description={dictionary.visual.workflowMiniMap.label}>
      <div className={styles.workspaceFlowMap}>
        {dictionary.visual.workflowMiniMap.steps.map((step, index) => (
          <div
            key={step}
            className={`${styles.workspaceFlowNode} ${index === 2 ? styles.workspaceFlowDecision : ""} ${
              index === 3 ? styles.workspaceFlowHandoff : ""
            }`}
          >
            <span>{step}</span>
            {index === 3 ? <strong>{dictionary.visual.workflowMiniMap.warning}</strong> : null}
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function WorkspaceScreenVisuals({
  pageKey,
  dictionary,
}: {
  pageKey: PageVisualKey;
  dictionary: WorkspaceDictionary;
}) {
  if (pageKey === "sources") {
    return (
      <>
        <TruthBoundaryCard dictionary={dictionary} />
        <WorkspacePanel title={dictionary.pages.sources.title}>
          <div className={styles.workspaceCapabilityGrid}>
            {dictionary.visual.screenPanels.sources.cards.map((card) => (
              <div key={card} className={styles.workspaceCapabilityCard}>
                {card}
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </>
    );
  }

  if (pageKey === "hierarchy") {
    return (
      <>
        <DepartmentRoleInterfaceMap dictionary={dictionary} />
        <TruthBoundaryCard dictionary={dictionary} />
        <WorkspacePanel title={dictionary.visual.screenPanels.hierarchy.whyTitle}>
          <p className={styles.workspaceCardPurpose}>{dictionary.visual.screenPanels.hierarchy.whyText}</p>
        </WorkspacePanel>
      </>
    );
  }

  if (pageKey === "targeting") {
    return (
      <>
        <WorkspacePanel title={dictionary.pages.targeting.title}>
          <div className={styles.workspaceCapabilityGrid}>
            {dictionary.visual.screenPanels.targeting.cards.map((card) => (
              <div key={card} className={styles.workspaceCapabilityCard}>
                {card}
              </div>
            ))}
          </div>
        </WorkspacePanel>
        <WorkspacePanel title={dictionary.visual.screenPanels.targeting.questionSeedsTitle}>
          <ul className={styles.workspaceSeedList}>
            {dictionary.visual.screenPanels.targeting.questionSeeds.map((seed) => (
              <li key={seed}>{seed}</li>
            ))}
          </ul>
        </WorkspacePanel>
        <TruthBoundaryCard dictionary={dictionary} />
      </>
    );
  }

  if (pageKey === "evidence") {
    return (
      <>
        <EvidenceMetricRow dictionary={dictionary} />
        <WorkspacePanel title={dictionary.visual.screenPanels.evidence.lifecycleTitle}>
          <div className={styles.workspaceReadinessStrip}>
            {dictionary.visual.screenPanels.evidence.lifecycle.map((step) => (
              <div key={step} className={styles.workspaceReadinessStep}>
                <span>{step}</span>
                <WorkspaceStatusPill dictionary={dictionary} status="placeholder" />
              </div>
            ))}
          </div>
        </WorkspacePanel>
        <ReviewIssueList dictionary={dictionary} />
        <TruthBoundaryCard dictionary={dictionary} />
      </>
    );
  }

  if (pageKey === "analysis") {
    return (
      <>
        <div className={styles.workspaceTabLikeGrid}>
          {dictionary.visual.screenPanels.analysis.tabs.map((tab, index) => (
            <div key={tab} className={styles.workspaceTabLike}>
              <span>{tab}</span>
              <WorkspaceStatusPill
                dictionary={dictionary}
                status={index === 0 ? "ready" : index === 2 ? "blocked" : "waiting"}
              />
            </div>
          ))}
        </div>
        <MethodLensGrid dictionary={dictionary} />
        <PackageReadinessStrip dictionary={dictionary} />
        <WorkflowMiniMap dictionary={dictionary} />
        <DepartmentRoleInterfaceMap dictionary={dictionary} compact />
        <ReviewIssueList dictionary={dictionary} limit={2} />
      </>
    );
  }

  if (pageKey === "prompts") {
    return (
      <>
        <TruthBoundaryCard dictionary={dictionary} />
        <WorkspacePanel title={dictionary.pages.prompts.title}>
          <div className={styles.workspacePromptGrid}>
            {dictionary.visual.screenPanels.prompts.groups.map((group) => (
              <article key={group} className={styles.workspacePromptCard}>
                <h4>{group}</h4>
                <div className={styles.workspacePromptActions}>
                  <button type="button" disabled>{dictionary.visual.actions.tune}</button>
                  <button type="button" disabled>{dictionary.visual.actions.compare}</button>
                  <button type="button" disabled>{dictionary.visual.actions.activate}</button>
                </div>
              </article>
            ))}
          </div>
        </WorkspacePanel>
        <WorkspacePanel title={dictionary.visual.screenPanels.prompts.comparisonTitle}>
          <div className={styles.workspaceComparison}>
            <p>{dictionary.visual.screenPanels.prompts.before}</p>
            <p>{dictionary.visual.screenPanels.prompts.after}</p>
          </div>
        </WorkspacePanel>
      </>
    );
  }

  return (
    <>
      <WorkspacePanel title={dictionary.visual.screenPanels.package.blockedTitle}>
        <p className={styles.workspaceCardPurpose}>{dictionary.visual.screenPanels.package.blockedText}</p>
      </WorkspacePanel>
      <PackageReadinessStrip dictionary={dictionary} />
      <WorkspacePanel title={dictionary.pages.package.title}>
        <div className={styles.workspaceCapabilityGrid}>
          {dictionary.visual.screenPanels.package.artifacts.map((artifact) => (
            <div key={artifact} className={styles.workspaceCapabilityCard}>
              {artifact}
            </div>
          ))}
        </div>
      </WorkspacePanel>
      <WorkflowMiniMap dictionary={dictionary} />
    </>
  );
}
