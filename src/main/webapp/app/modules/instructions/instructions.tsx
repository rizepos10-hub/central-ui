import React, { useEffect, useState } from "react";
import "./instructions.css";
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from "react-router-dom";
import { getBranchesCredentials } from "app/entities/settings/business-details/business-detail.reducer";
import { useAppDispatch } from "app/config/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Loader2 } from 'lucide-react';




export default function Instructions() {
  const dispatch = useAppDispatch()
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const showWelcome = queryParams.has("welcome");

  const findBranch = (branchId) => {
    const foundBranch = branchesCredentials?.branches?.find(branch => branch.id === branchId) || {}

    return foundBranch.client ? foundBranch : {}
  }

  const [branchesCredentials, setBranchesCredentials] = useState<any>({});

  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
  const [loading, setLoading] = useState(false)

  console.log(branchesCredentials, 'branchesCredentials')

  const branchToShow = findBranch(selectedBranch);

  console.log(branchToShow, 'branchToShow')



  const data = [
    { title: 'Apple', url: 'content/images/apple.jpeg', link: 'https://apps.apple.com/th/app/rize-pos-client/id6476973045' },
    { title: 'Android', url: 'content/images/android.png', link: '/pos-resources/apk/app-release.apk' },
    { title: 'Windows', url: 'content/images/windows.png', link: '/pos-resources/win/rize_pos_setup.exe' }
  ]

  useEffect(() => {

    setLoading(true)
    dispatch(getBranchesCredentials({}))
      .then((res: any) => {
        const receivedData = res?.payload?.data;
        setBranchesCredentials(receivedData);
        const defaultSelectedBranch = receivedData?.branches?.[0]?.id || null;
        setSelectedBranch(defaultSelectedBranch);
        setLoading(false)
      })

  }, []);

  const CardComponent = ({ imageUrl, link }) => {
    return (
      <div className="flex justify-center">
        <a href={link} target="_blank" rel="noopener noreferrer" className="card-link">
          <Card className="w-64 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <img alt="Card Image" src={imageUrl} className="h-40 w-full object-contain" />
            </CardContent>
          </Card>
        </a>
      </div>
    );
  };



  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </PageWrapper>
    );
  }





  return (
    <PageWrapper>
      <div className="welcome-container">
        {showWelcome && <div className="welcome-content">
          <div>
            <span className="welcome-rize">Welcome to Rize POS!</span>
          </div>
          <h2 className={"instructions"}>Please Follow the bellow instruction </h2>
        </div>}

        <div className="steps-column">

          <div className="step">
            <h2>Step 1</h2>
            <p>
              As initial step you need to run the POS  server so the pos clients can connect to the cloud.
              Please download the setup from the link and run it on  your local server.
            </p>
            <a rel="noreferrer" href={`/pos-resources/pos-server-installer.exe`} target={"_blank"} >POS SERVER</a>

            <h4>Credentials</h4>
            <div className="flex gap-5">
              <div>
                <Select
                  value={selectedBranch}
                  onValueChange={(value) => setSelectedBranch(value)}
                >
                  <SelectTrigger className="h-7 text-xs min-w-[200px]">
                    <SelectValue placeholder="Select a branch.." />
                  </SelectTrigger>
                  <SelectContent>
                    {branchesCredentials?.branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id} className="text-xs">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


            {branchToShow &&
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold mb-3">Branch Information</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="mr-3">Client ID:</strong>
                      {branchToShow?.client?.clientId}
                    </div>
                    <div>
                      <strong className="mr-3">Client Secret:</strong>
                      {branchToShow?.client?.serviceSecret}
                    </div>
                    <div>
                      <strong className="mr-3">Branch ID:</strong>
                      {branchToShow.id}
                    </div>
                    <div>
                      <strong className="mr-3">Name:</strong>
                      {branchToShow.name}
                    </div>
                    {/* <div>
                      <strong className="mr-3">Service URL:</strong>
                      {branchToShow?.client?.serviceUrl || 'N/A'}
                    </div>
                    <div>
                      <strong className="mr-3">Details:</strong>
                      {branchToShow?.client?.details || 'N/A'}
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            }

            {branchesCredentials?.brokerConfig &&
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold mb-3">Business Information</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="mr-3">Realm Id:</strong>
                      {branchesCredentials?.realmId}
                    </div>
                    <div>
                      <strong className="mr-3">Host Name:</strong>
                      {branchesCredentials?.brokerConfig?.vHostName}
                    </div>
                    <div>
                      <strong className="mr-3">Username:</strong>
                      {branchesCredentials?.brokerConfig?.users[0]?.username}
                    </div>
                    <div>
                      <strong className="mr-3">Password:</strong>
                      {branchesCredentials?.brokerConfig?.users[0]?.password}
                    </div>
                    {/* <div>
                      <strong className="mr-3">Exchange:</strong>
                      {branchesCredentials?.brokerConfig.topics[0]}
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            }
            </div>
          </div>

          <div className="step">
            <h2>Step 2</h2>
            <p>
              You can download the POS terminal and connect it to your server.
            </p>
            <div className="flex justify-around">
              {data.map(item => (
                <CardComponent
                  key={item.title}
                  imageUrl={item.url}
                  link={item.link}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
