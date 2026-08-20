import React, { useEffect, useState } from 'react';
import './instructions.css';
import { Card, CardContent } from '@/components/ui/card';
import { getBranchesCredentials } from 'app/entities/settings/business-details/business-detail.reducer';
import { useAppDispatch } from 'app/config/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ArrowUpRight, ChefHat, Download, ExternalLink, KeyRound, Loader2, Monitor, Server, Smartphone, Store } from 'lucide-react';

const platformLinks = [
  {
    title: 'Apple',
    description: 'Open App Store',
    imageUrl: 'content/images/apple.jpeg',
    link: 'https://apps.apple.com/th/app/rize-pos-client/id6476973045',
  },
  { title: 'Android', description: 'Download APK', imageUrl: 'content/images/android.png', link: '/pos-resources/apk/app-release.apk' },
  {
    title: 'Windows',
    description: 'Download installer',
    imageUrl: 'content/images/windows.png',
    link: '/pos-resources/win/rize_pos_setup.exe',
  },
];

const placeholderLinks = (windowsLink: string) =>
  platformLinks.map(platform => ({
    ...platform,
    description: platform.title === 'Windows' ? platform.description : 'Link coming soon',
    link: platform.title === 'Windows' ? windowsLink : '#',
  }));

const appDownloads = [
  {
    id: 'pos',
    title: 'Point of sale',
    description: 'For cashiers and front-of-house teams.',
    icon: Store,
    placeholder: false,
    links: platformLinks,
  },
  {
    id: 'kiosk',
    title: 'Kiosk',
    description: 'Let guests place orders from a self-service station.',
    icon: Monitor,
    placeholder: true,
    links: placeholderLinks('/pos-resources/win/lightpayment_kiosk_setup.exe'),
  },
  {
    id: 'kds',
    title: 'Kitchen display system',
    description: 'Keep kitchen orders visible and moving.',
    icon: ChefHat,
    placeholder: true,
    links: placeholderLinks('/pos-resources/win/lightpayment_kds_setup.exe'),
  },
  {
    id: 'customer-screen',
    title: 'Customer screen',
    description: 'Give customers a clear, customer-facing ordering display.',
    icon: Smartphone,
    placeholder: true,
    links: placeholderLinks('/pos-resources/win/lightpayment_cs_setup.exe'),
  },
];

const CredentialItem = ({ label, value }: { label: string; value?: string }) => (
  <div className="credential-item">
    <dt>{label}</dt>
    <dd>{value || 'Not available'}</dd>
  </div>
);

const PlatformDownload = ({
  title,
  description,
  imageUrl,
  link,
}: {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}) => (
  <a href={link} target="_blank" rel="noreferrer" className="platform-download">
    <span className="platform-download__image">
      <img src={imageUrl} alt={`${title} logo`} />
    </span>
    <span className="platform-download__copy">
      <span className="platform-download__title">{title}</span>
      <span className="platform-download__description">{description}</span>
    </span>
    <ArrowUpRight className="platform-download__arrow" size={17} aria-hidden="true" />
  </a>
);

export default function Instructions() {
  const dispatch = useAppDispatch();

  const [branchesCredentials, setBranchesCredentials] = useState<any>({});
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const branchToShow = branchesCredentials?.branches?.find(branch => branch.id === selectedBranch && branch.client);
  const brokerUser = branchesCredentials?.brokerConfig?.users?.[0];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    dispatch(getBranchesCredentials({}))
      .then((res: any) => {
        if (!isMounted) return;

        const receivedData = res?.payload?.data || {};
        setBranchesCredentials(receivedData);
        setSelectedBranch(receivedData?.branches?.[0]?.id);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="instructions-loading" role="status">
          <Loader2 className="animate-spin" size={22} aria-hidden="true" />
          <span>Loading your setup details…</span>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <main className="instructions-page">
        <section id="server-setup" className="instructions-section">
          <div className="instructions-section__heading">
            <div>
              <p className="instructions-eyebrow">Connect your branch</p>
              <h2>Start the local POS server</h2>
              <p>Run the server on the computer that your POS devices will connect to.</p>
            </div>
          </div>

          <Card className="instructions-panel instructions-server-panel">
            <CardContent className="instructions-server-panel__content">
              <div className="instructions-server-panel__intro">
                <div className="instructions-icon-tile instructions-icon-tile--blue">
                  <Server size={24} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div>
                  <h3>POS server installer</h3>
                  <p>Install once on your local server, then keep it running while the branch is open.</p>
                </div>
              </div>
              <a rel="noreferrer" href="/pos-resources/pos-server-installer.exe" target="_blank" className="server-download">
                <Download size={17} aria-hidden="true" />
                Download server
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </CardContent>

            <div className="credentials-area">
              <div className="credentials-area__heading">
                <div>
                  <p className="instructions-eyebrow">Connection details</p>
                  <h3>Credentials for your devices</h3>
                </div>
                <KeyRound size={20} aria-hidden="true" />
              </div>

              <div className="credentials-grid">
                <div className="credentials-card">
                  <div className="credentials-card__header">
                    <div>
                      <h4>Branch credentials</h4>
                      <p>Choose the branch you are setting up.</p>
                    </div>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="instructions-select">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchesCredentials?.branches?.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {branchToShow ? (
                    <dl className="credentials-list">
                      <CredentialItem label="Client ID" value={branchToShow?.client?.clientId} />
                      <CredentialItem label="Client secret" value={branchToShow?.client?.serviceSecret} />
                      <CredentialItem label="Branch ID" value={branchToShow.id} />
                      <CredentialItem label="Branch name" value={branchToShow.name} />
                    </dl>
                  ) : (
                    <p className="credentials-empty">Select a branch to view its connection details.</p>
                  )}
                </div>

                {branchesCredentials?.brokerConfig && (
                  <div className="credentials-card">
                    <div className="credentials-card__header">
                      <div>
                        <h4>Business credentials</h4>
                        <p>Use these details when the server asks for them.</p>
                      </div>
                    </div>
                    <dl className="credentials-list">
                      <CredentialItem label="Realm ID" value={branchesCredentials?.realmId} />
                      <CredentialItem label="Host name" value={branchesCredentials?.brokerConfig?.vHostName} />
                      <CredentialItem label="Username" value={brokerUser?.username} />
                      <CredentialItem label="Password" value={brokerUser?.password} />
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section id="app-downloads" className="instructions-section instructions-apps-section">
          <div className="instructions-section__heading">
            <div>
              <p className="instructions-eyebrow">Choose what each station needs</p>
              <h2>Install your team&apos;s apps</h2>
              <p>Pick an app, then choose the platform for the device you are setting up.</p>
            </div>
          </div>

          <div className="app-download-list">
            {appDownloads.map(app => {
              const AppIcon = app.icon;

              return (
                <article key={app.id} className="app-download-row">
                  <div className="app-download-row__identity">
                    <div className="instructions-icon-tile instructions-icon-tile--neutral">
                      <AppIcon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div>
                      <div className="app-download-row__title-line">
                        <h3>{app.title}</h3>
                        {app.placeholder && <span className="placeholder-badge">Temporary link</span>}
                      </div>
                      <p>{app.description}</p>
                    </div>
                  </div>

                  <div className="platform-links">
                    {app.links.map(platform => (
                      <PlatformDownload key={`${app.id}-${platform.title}`} {...platform} />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="placeholder-disclaimer">
            <ExternalLink size={15} aria-hidden="true" />
            Kiosk, KDS, and Customer screen currently use the POS download URLs as placeholders. Replace them when the final links are
            ready.
          </p>
        </section>
      </main>
    </PageWrapper>
  );
}
