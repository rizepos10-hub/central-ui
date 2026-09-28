import React, { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Printer, Search } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';
import { HELP_GROUPS, HELP_TOPICS, HelpTopic, searchTopics } from './help-content';

export const canUseTopic = (topic: HelpTopic, authorities: string[]) => !topic.page || hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES[topic.page]);

const TopicBody = ({ topic, canOpen }: { topic: HelpTopic; canOpen: boolean }) => (
  <article className="grid gap-4" data-testid={`help-topic-${topic.id}`}>
    <header className="grid gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-xl font-semibold">{topic.title}</h2>
        {topic.audience && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">For {topic.audience.toLowerCase()}</span>}
        {topic.path && canOpen && (
          <Link to={topic.path} className="inline-flex items-center gap-1 text-sm text-primary hover:underline print:hidden">
            Open the page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <p className="m-0 text-muted-foreground">{topic.summary}</p>
      {topic.path && <span className="text-xs text-muted-foreground">Wholesale menu: {topic.group}</span>}
    </header>
    {topic.sections.map(section => (
      <section key={section.heading} className="grid gap-2">
        <h3 className="m-0 text-base font-semibold">{section.heading}</h3>
        {section.text?.map(paragraph => (
          <p key={paragraph} className="m-0 text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
        {section.steps && (
          <ol className="m-0 grid list-decimal gap-1 pl-5 text-sm leading-relaxed">
            {section.steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {section.bullets && (
          <ul className="m-0 grid list-disc gap-1 pl-5 text-sm leading-relaxed">
            {section.bullets.map(bullet => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        )}
        {section.table && (
          <div className="overflow-x-auto rounded-md border">
            <table className="ws-table">
              <thead>
                <tr>
                  {section.table.headers.map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map(row => (
                  <tr key={row.join('|')}>
                    {row.map((cell, index) => (
                      <td key={index} className={cn('align-top', index === 0 && 'whitespace-nowrap font-medium')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    ))}
  </article>
);

/** The Wholesale user guide: every page and app explained, filtered to what the user's roles can open. */
const WholesaleHelp = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(true);
  const topicRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const printTopic = useReactToPrint({ content: () => topicRef.current, documentTitle: 'Wholesale help' });
  const printGuide = useReactToPrint({ content: () => guideRef.current, documentTitle: 'Wholesale user guide' });

  const available = useMemo(() => (mineOnly ? HELP_TOPICS.filter(t => canUseTopic(t, authorities)) : HELP_TOPICS), [mineOnly, authorities]);
  const matches = useMemo(() => searchTopics(available, query), [available, query]);
  const groups = HELP_GROUPS.map(group => ({ group, topics: matches.filter(t => t.group === group) })).filter(g => g.topics.length > 0);

  const requested = searchParams.get('topic');
  const topic = HELP_TOPICS.find(t => t.id === requested) ?? matches[0] ?? HELP_TOPICS[0];

  const open = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('topic', id);
    setSearchParams(next, { replace: true });
    window.scrollTo?.({ top: 0 });
  };

  return (
    <WholesalePage
      title="Help"
      context="The Wholesale user guide"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="ws-control" onClick={printTopic}>
            <Printer className="mr-1 h-4 w-4" /> Print topic
          </Button>
          <Button variant="outline" className="ws-control" onClick={printGuide}>
            <Printer className="mr-1 h-4 w-4" /> Print guide
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <nav className="ws-card grid content-start gap-3 p-3 lg:sticky lg:top-2 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto" aria-label="Help topics">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input className="ws-control pl-8" placeholder="Search help" aria-label="Search help" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={mineOnly} onCheckedChange={v => setMineOnly(v === true)} aria-label="Only pages I can open" />
            Only pages I can open
          </label>
          {groups.map(({ group, topics }) => (
            <div key={group} className="grid gap-0.5">
              <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</span>
              {topics.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={cn('rounded px-2 py-1 text-left text-sm hover:bg-accent', t.id === topic.id && 'bg-accent font-medium')}
                  aria-current={t.id === topic.id ? 'page' : undefined}
                  onClick={() => open(t.id)}
                >
                  {t.title}
                </button>
              ))}
            </div>
          ))}
          {groups.length === 0 && <span className="px-2 text-sm text-muted-foreground">No topic matches the search.</span>}
        </nav>

        <div ref={topicRef} data-testid="help-current" className="ws-card p-5 print:border-0 print:p-8">
          <TopicBody topic={topic} canOpen={canUseTopic(topic, authorities)} />
        </div>
      </div>

      <div className="hidden">
        <div ref={guideRef} className="grid gap-10 p-8">
          <h1 className="m-0 text-2xl font-semibold">Wholesale user guide</h1>
          {HELP_GROUPS.flatMap(group => available.filter(t => t.group === group)).map(t => (
            <TopicBody key={t.id} topic={t} canOpen={false} />
          ))}
        </div>
      </div>
    </WholesalePage>
  );
};

export default WholesaleHelp;
