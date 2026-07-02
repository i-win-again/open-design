/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  CUSTOM_MODEL_SENTINEL,
  isCustomModel,
  renderModelOptions,
} from '../../src/components/modelOptions';
import type { AgentModelOption } from '../../src/types';

function renderOptions(models: AgentModelOption[]): string {
  return renderToStaticMarkup(<select>{renderModelOptions(models)}</select>);
}

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableModelSelect } from '../../src/components/modelOptions';

describe('renderModelOptions', () => {
  it('renders an empty model list without options', () => {
    expect(renderOptions([])).toBe('<select></select>');
  });

  it('renders flat model lists as ungrouped options in alphabetical order', () => {
    expect(
      renderOptions([
        { id: 'sonnet', label: 'Claude Sonnet' },
        { id: 'default', label: 'Default' },
        { id: 'opus', label: 'Claude Opus' },
      ]),
    ).toBe(
      '<select><option value="default">Default</option><option value="opus">Claude Opus</option><option value="sonnet">Claude Sonnet</option></select>',
    );
  });

  it('pins default and sorts flat options and provider optgroups alphabetically', () => {
    expect(
      renderOptions([
        { id: 'openai/o3', label: 'openai/o3' },
        { id: 'custom-local', label: 'Custom local' },
        { id: 'default', label: 'Default' },
        { id: 'anthropic/claude-sonnet-4.5', label: 'anthropic/claude-sonnet-4.5' },
        { id: 'openai/gpt-5.1', label: 'openai/gpt-5.1' },
      ]),
    ).toBe(
      '<select><option value="default">Default</option><option value="custom-local">Custom local</option><optgroup label="anthropic"><option value="anthropic/claude-sonnet-4.5">claude-sonnet-4.5</option></optgroup><optgroup label="openai"><option value="openai/gpt-5.1">gpt-5.1</option><option value="openai/o3">o3</option></optgroup></select>',
    );
  });

  it('treats leading-slash ids as flat and only strips matching provider label prefixes', () => {
    expect(
      renderOptions([
        { id: 'openai/gpt-5.1', label: 'GPT 5.1' },
        { id: '/missing-provider', label: '/missing-provider' },
        { id: 'openai/o3', label: 'openai/o3' },
      ]),
    ).toBe(
      '<select><option value="/missing-provider">/missing-provider</option><optgroup label="openai"><option value="openai/gpt-5.1">GPT 5.1</option><option value="openai/o3">o3</option></optgroup></select>',
    );
  });
});

describe('SearchableModelSelect', () => {
  it('sorts allOptions alphabetically with default pinned first', () => {
    render(
      <SearchableModelSelect
        models={[
          { id: 'sonnet', label: 'Claude Sonnet' },
          { id: 'default', label: 'Default' },
          { id: 'opus', label: 'Claude Opus' },
        ]}
        value="default"
        onChange={() => {}}
        searchPlaceholder="Search"
      />
    );
    fireEvent.click(screen.getByRole('combobox'));
    const options = screen.getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual([
      'Default',
      'Claude Opus',
      'Claude Sonnet'
    ]);
  });
});

describe('isCustomModel', () => {
  const models: AgentModelOption[] = [
    { id: 'default', label: 'Default' },
    { id: 'openai/gpt-5.1', label: 'openai/gpt-5.1' },
  ];

  it('returns false for empty selections and listed model ids', () => {
    expect(isCustomModel(null, models)).toBe(false);
    expect(isCustomModel(undefined, models)).toBe(false);
    expect(isCustomModel('', models)).toBe(false);
    expect(isCustomModel('default', models)).toBe(false);
    expect(isCustomModel('openai/gpt-5.1', models)).toBe(false);
  });

  it('returns true for unlisted custom ids and the custom sentinel', () => {
    expect(isCustomModel('local/my-model', models)).toBe(true);
    expect(isCustomModel(CUSTOM_MODEL_SENTINEL, models)).toBe(true);
  });
});
