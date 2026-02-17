import { formatDistanceToNow } from 'date-fns';

export function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function generateContextPrompt(project: {
  title: string;
  objective: string;
  chosenDirection: string;
  alternatives: string[];
  drafts: { title: string; content: string; status: string }[];
  nextAction: string;
}, options: {
  includeAlternatives: boolean;
  includeDraft1: boolean;
  includeDraft2: boolean;
  includeTranscript?: string;
}): string {
  const lines: string[] = [];
  lines.push(`Title: ${project.title}`);
  lines.push(`Objective: ${project.objective}`);
  lines.push(`Chosen Direction: ${project.chosenDirection}`);

  if (options.includeAlternatives && project.alternatives.length > 0) {
    lines.push(`Alternatives:`);
    project.alternatives.forEach((a, i) => lines.push(`  ${i + 1}. ${a}`));
  }

  if (options.includeDraft1 && project.drafts[0]) {
    lines.push(`Draft 1 (${project.drafts[0].title}) [${project.drafts[0].status}]:`);
    lines.push(project.drafts[0].content);
  }

  if (options.includeDraft2 && project.drafts[1]) {
    lines.push(`Draft 2 (${project.drafts[1].title}) [${project.drafts[1].status}]:`);
    lines.push(project.drafts[1].content);
  }

  if (options.includeTranscript) {
    lines.push(`Transcript Snippet:`);
    lines.push(options.includeTranscript);
  }

  lines.push(`Next Action: ${project.nextAction}`);
  lines.push(`Timestamp: ${new Date().toISOString()}`);
  lines.push(`Instruction: "Paste into your AI chat to resume."`);

  return lines.join('\n');
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function compileContextInjectPrompt(project: {
  title: string;
  objective: string;
  chosenDirection: string;
  alternatives: string[];
  nextAction: string;
  lastActiveAt: string;
  activityLog: { description: string; timestamp: string }[];
}): string {
  const lines: string[] = [];

  lines.push('You are continuing work on the following project.');
  lines.push('');
  lines.push('PROJECT TITLE:');
  lines.push(project.title);
  lines.push('');
  lines.push('OBJECTIVE:');
  lines.push(project.objective || 'Not set');
  lines.push('');
  lines.push('CHOSEN DIRECTION:');
  lines.push(project.chosenDirection || 'Not set');
  lines.push('');
  lines.push('ALTERNATIVES CONSIDERED:');
  if (project.alternatives.length > 0) {
    project.alternatives.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  } else {
    lines.push('None');
  }
  lines.push('');
  lines.push('NEXT ACTION:');
  lines.push(project.nextAction || 'Not set');
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
  lines.push('');
  lines.push('CURRENT STATUS:');
  lines.push(`Last active ${relativeTime(project.lastActiveAt)}`);
  lines.push('');
  lines.push('Continue from this state. Do not restate the summary.');
  lines.push('Move directly into execution planning.');

  return lines.join('\n');
}
