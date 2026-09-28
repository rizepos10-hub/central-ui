import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleHelp, { canUseTopic } from './help';
import { HELP_GROUPS, HELP_TOPICS, searchTopics } from './help-content';

const renderHelp = (authorities: string[], path = '/logistics/help') => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <WholesaleHelp />
      </MemoryRouter>
    </Provider>,
  );
};

const tocTitles = () =>
  within(screen.getByRole('navigation', { name: 'Help topics' }))
    .queryAllByRole('button')
    .map(b => b.textContent);

const current = () => screen.getByTestId('help-current');

describe('Wholesale help', () => {
  it('has unique topic ids, known groups and non-empty sections', () => {
    const ids = HELP_TOPICS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    HELP_TOPICS.forEach(topic => {
      expect(HELP_GROUPS).toContain(topic.group);
      expect(topic.sections.length).toBeGreaterThan(0);
      topic.sections.forEach(s => expect(Boolean(s.text || s.steps || s.bullets || s.table)).toBe(true));
    });
  });

  it('searches every word across titles and section text', () => {
    expect(searchTopics(HELP_TOPICS, '').length).toBe(HELP_TOPICS.length);
    const found = searchTopics(HELP_TOPICS, 'credit memo').map(t => t.id);
    expect(found).toContain('credit-memos');
    expect(searchTopics(HELP_TOPICS, 'zzzz-nothing')).toEqual([]);
  });

  it('shows a salesman only the topics for pages he can open, and everything once unfiltered', () => {
    renderHelp([AUTHORITIES.WHOLESALE_SALESMAN]);
    const titles = tocTitles();
    expect(titles).toContain('Order Entry');
    expect(titles).not.toContain('Reconciliation');
    expect(titles).toContain('Glossary');
    expect(titles.length).toBe(HELP_TOPICS.filter(t => canUseTopic(t, [AUTHORITIES.WHOLESALE_SALESMAN])).length);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Only pages I can open' }));
    expect(tocTitles().length).toBe(HELP_TOPICS.length);
  });

  it('opens the topic from the link and offers the page only to roles that can open it', () => {
    renderHelp([AUTHORITIES.WHOLESALE_BOOKKEEPER], '/logistics/help?topic=reconciliation');
    expect(within(current()).getByRole('heading', { level: 2 }).textContent).toBe('Reconciliation');
    expect(within(current()).getByRole('link', { name: /Open the page/ }).getAttribute('href')).toBe('/logistics/reconciliation');
  });

  it('hides the Open link when the role cannot use the page', () => {
    renderHelp([AUTHORITIES.WHOLESALE_SALESMAN], '/logistics/help?topic=reconciliation');
    expect(within(current()).getByRole('heading', { level: 2 }).textContent).toBe('Reconciliation');
    expect(within(current()).queryByRole('link', { name: /Open the page/ })).toBeNull();
  });

  it('switches topics from the contents list and narrows it with search', () => {
    renderHelp([AUTHORITIES.WHOLESALE_ADMIN]);
    fireEvent.change(screen.getByLabelText('Search help'), { target: { value: 'handover' } });
    expect(tocTitles()).toContain('Cash Handover');
    expect(tocTitles()).not.toContain('Factories');
    fireEvent.click(screen.getByRole('button', { name: 'Cash Handover' }));
    expect(within(current()).getByRole('heading', { level: 2 }).textContent).toBe('Cash Handover');
  });
});
