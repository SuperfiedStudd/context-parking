import { formatDistanceToNow } from 'date-fns';

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface InjectPromptOptions {
  includeObjective: boolean;
  includeDirection: boolean;
  includeStrategicForks: boolean;
  includeDeferredDecisions: boolean;
  includeNextAction: boolean;
  includeActivity: boolean;
  includeStatus: boolean;
}

export const defaultInjectOptions: InjectPromptOptions = {
  includeObjective: true,
  includeDirection: true,
  includeStrategicForks: true,
  includeDeferredDecisions: true,
  includeNextAction: true,
  includeActivity: true,
  includeStatus: true,
};

export function compileContextInjectPrompt(
  project: {
    title: string;
    objective: string;
    chosenDirection: string;
    strategicForks: string[];
    deferredDecisions: string[];
    nextAction: string;
    lastActiveAt: string;
    activityLog: { description: string; timestamp: string }[];
  },
  options: InjectPromptOptions = defaultInjectOptions,
): string {
  const lines: string[] = [];

  lines.push('You are continuing work on the following project.');
  lines.push('');
  lines.push('PROJECT TITLE:');
  lines.push(project.title);

  if (options.includeObjective) {
    lines.push('');
    lines.push('OBJECTIVE:');
    lines.push(project.objective || 'Not set');
  }

  if (options.includeDirection) {
    lines.push('');
    lines.push('CHOSEN DIRECTION:');
    lines.push(project.chosenDirection || 'Not set');
  }

  if (options.includeStrategicForks) {
    lines.push('');
    lines.push('STRATEGIC FORKS:');
    if (project.strategicForks.length > 0) {
      project.strategicForks.forEach((f, i) => lines.push(`${i + 1}. ${f}`));
    } else {
      lines.push('None');
    }
  }

  if (options.includeDeferredDecisions) {
    lines.push('');
    lines.push('DEFERRED DECISIONS:');
    if (project.deferredDecisions.length > 0) {
      project.deferredDecisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
    } else {
      lines.push('None');
    }
  }

  if (options.includeNextAction) {
    lines.push('');
    lines.push('NEXT ACTION:');
    lines.push(project.nextAction || 'Not set');
  }

  if (options.includeActivity) {
    lines.push('');
    lines.push('RECENT ACTIVITY:');
    const recentEvents = project.activityLog.slice(0, 3);
    if (recentEvents.length > 0) {
      recentEvents.forEach((e) => {
        lines.push(`- ${e.description} (${relativeTime(e.timestamp)})`);
      });
    } else {
      lines.push('No recent activity');
    }
  }

  if (options.includeStatus) {
    lines.push('');
    lines.push('CURRENT STATUS:');
    lines.push(`Last active ${relativeTime(project.lastActiveAt)}`);
  }

  lines.push('');
  lines.push('Continue from this state. Do not restate the summary.');
  lines.push('Move directly into execution planning.');

  return lines.join('\n');
}
