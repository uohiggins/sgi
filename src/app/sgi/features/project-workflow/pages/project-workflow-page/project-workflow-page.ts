import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { UohButton } from 'uoh-ui';
import {
  UohxTimeline,
  UohxTimelineStep,
} from '../../../../../shared/uoh-derived/uohx-timeline/uohx-timeline';
import { ProjectWorkflowState } from '../../services/project-workflow-state';

@Component({
  selector: 'sgi-project-workflow-page',
  standalone: true,
  imports: [UohButton, UohxTimeline],
  providers: [ProjectWorkflowState],
  templateUrl: './project-workflow-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectWorkflowPage {
  readonly state = inject(ProjectWorkflowState);

  // Parámetro de ruta (withComponentInputBinding)
  readonly projectId = input.required<string>();

  constructor() {
    effect(() => {
      const id = Number(this.projectId());
      if (Number.isFinite(id)) this.state.load(id);
    });
  }

  readonly steps = computed<UohxTimelineStep[]>(() =>
    this.state
      .viewedStagePhases()
      .map((phase) => ({ label: phase.name, icon: this.state.phaseIcon(phase) })),
  );
}
