import React, {useEffect, useState} from "react";
import "./instructions.css";
import { Card } from 'primereact/card';
import {useLocation} from "react-router-dom";
import {getBranchesCredentials} from "app/entities/settings/business-details/business-detail.reducer";
import {useAppDispatch} from "app/config/store";
import {Dropdown} from "primereact/dropdown";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {CardBody, CardText, CardTitle} from "reactstrap";




export default function Instructions()
{
  const dispatch = useAppDispatch()
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const showWelcome = queryParams.has("welcome");

  const findBranch = (branchId) => {
   const foundBranch = branchesCredentials?.branches?.find(branch => branch.id === branchId) || {}

    return foundBranch.client ? foundBranch : {}
  }

  const [branchesCredentials,setBranchesCredentials] = useState<any>({});

  const [selectedBranch, setSelectedBranch] = useState();

  console.log(branchesCredentials, 'branchesCredentials')

  const branchToShow = findBranch(selectedBranch);

  console.log(branchToShow, 'branchToShow')



  const data = [
    {title: 'Apple', url: 'content/images/apple.jpeg', link: 'https://www.apple.com/store'},
    {title: 'Android', url: 'content/images/android.png', link: 'https://play.google.com/'},
    {title: 'Windows', url: 'content/images/windows.png', link: 'https://www.apple.com/store'}
  ]

  useEffect(() => {

    dispatch(getBranchesCredentials({}))
      .then((res: any) => {
        const receivedData = res?.payload?.data;
        setBranchesCredentials(receivedData);
        const defaultSelectedBranch = receivedData?.branches?.[0]?.id || null;
        setSelectedBranch(defaultSelectedBranch);
      })

  }, []);

  const CardComponent = ({ imageUrl, link }) => {
    const header = <img alt="Card Image" src={imageUrl} style={{ height: '10rem' }} />;

    return (
      <div className="flex justify-content-center">
        <a href={link} target="_blank" rel="noopener noreferrer" className="card-link">
          <Card header={header} className="md:w-20rem" />
        </a>
      </div>
    );
  };








  return (
    <div className="welcome-container">
        <div className="welcome-content">
          {showWelcome &&
          <div>
            <span className="color-cycle">W</span>
            <span className="color-cycle">e</span>
            <span className="color-cycle">l</span>
            <span className="color-cycle">c</span>
            <span className="color-cycle">o</span>
            <span className="color-cycle">m</span>
            <span className="color-cycle">e</span>
            <span className="color-cycle">!</span>
          </div>   }
          <h2 className={`${showWelcome ? "welcome-instructions" : "instructions"}`}>Instructions</h2>
        </div>

          <div className="steps-column">

        <div className="step">
          <h2>Step 1</h2>
          <p>
            As initial step you need to run the POS  server so the pos clients can connect to the cloud.
            Please download the setup from the link and run it on  your local server.
          </p>
          <a rel="noreferrer" href="http://164.92.188.249/pos/installer.zip" target={"_blank"} >POS SERVER</a>

          <h4>Credentials</h4>
          <div className=" d-flex gap-5">
            <div>
              <Dropdown
                options={branchesCredentials?.branches?.map(branch => ({value: branch.id, label: branch.name}))}
                placeholder="Select a branch.."
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.value)}
              />
            </div>


            {branchToShow &&
              <div className="card">
              <div className="card-header">
                <h5>Branch Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong className="mr-3">ID:</strong>
                  {branchToShow.id}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Name:</strong>
                  {branchToShow.name}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Client ID:</strong>
                  {branchToShow?.client?.clientId}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Service Secret:</strong>
                  {branchToShow?.client?.serviceSecret}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Service URL:</strong>
                  {branchToShow?.client?.serviceUrl || 'N/A'}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Details:</strong>
                  {branchToShow?.client?.details || 'N/A'}
                </div>
              </div>
            </div>
            }

            {branchesCredentials.brokerConfig &&
              <div className="card" style={{marginBottom: '2rem'}}>
              <div className="card-header">
                <h5>Business Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong className="mr-3">Username:</strong>
                  {branchesCredentials?.brokerConfig?.users[0]?.username}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Password:</strong>
                  {branchesCredentials?.brokerConfig?.users[0]?.password}

                </div>
                <div className="mb-3">
                  <strong className="mr-3">Host Name:</strong>
                  {branchesCredentials?.brokerConfig?.vHostName}
                </div>
                <div className="mb-3">
                  <strong className="mr-3">Service Secret:</strong>
                  {branchesCredentials?.brokerConfig.topics[0]}

                </div>
              </div>
            </div>
            }
          </div>
        </div>

        <div className="step">
          <h2>Step 2</h2>
          <p>
            You can download the POS terminal and connect it to your server.
          </p>
          <div className="d-flex justify-content-around">
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
  );
}
