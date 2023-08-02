import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {Button, Input, InputGroup, FormGroup, Form, Row, Col, Table, Modal} from 'reactstrap';
import { Translate, translate, getSortState, JhiPagination, JhiItemCount } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT, APP_LOCAL_DATE_FORMAT } from 'app/config/constants';
import { ASC, DESC, ITEMS_PER_PAGE, SORT } from 'app/shared/util/pagination.constants';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { IAttachment } from 'app/shared/model/attachment.model';
import {searchEntities, getEntities, createEntity, uploadImage} from './attachment.reducer';

export const Attachment = () => {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const attachmentList = useAppSelector(state => state.attachment.entities);
  const loading = useAppSelector(state => state.attachment.loading);
  const totalItems = useAppSelector(state => state.attachment.totalItems);


  const [showRow, setShowRow] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedThumbnailImage, setSelectedThumbnailImage] = useState(null);

  const handleThumbnailClick = (url) => {
    setSelectedThumbnailImage(url);
  };


  const handleImageUpload = async () => {
    if (!selectedImage) {
      console.error('No image selected.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedImage);
    try {
      await dispatch(uploadImage(formData));
      console.log('Image Upload Successful');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  const getAllEntities = () => {
    if (search) {
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  };

  const startSearching = e => {
    if (search) {
      setPaginationState({
        ...paginationState,
        activePage: 1,
      });
      dispatch(
        searchEntities({
          query: search,
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
    e.preventDefault();
  };

  const clear = () => {
    setSearch('');
    setPaginationState({
      ...paginationState,
      activePage: 1,
    });
    dispatch(getEntities({}));
  };

  const handleSearch = event => setSearch(event.target.value);

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?page=${paginationState.activePage}&sort=${paginationState.sort},${paginationState.order}`;
    if (location.search !== endURL) {
      navigate(`${location.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [paginationState.activePage, paginationState.order, paginationState.sort, search,selectedImage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get('page');
    const sort = params.get(SORT);
    if (page && sort) {
      const sortSplit = sort.split(',');
      setPaginationState({
        ...paginationState,
        activePage: +page,
        sort: sortSplit[0],
        order: sortSplit[1],
      });
    }
  }, [location.search]);

  const sort = p => () => {
    setPaginationState({
      ...paginationState,
      order: paginationState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handlePagination = currentPage =>
    setPaginationState({
      ...paginationState,
      activePage: currentPage,
    });

  const handleSyncList = () => {
    sortEntities();
  };

  console.log(attachmentList, 'attachmentList')

  return (
    <div>
      <Button color="primary" onClick={() => setShowRow(!showRow)} className="mb-2">
        Add New Image
      </Button>
      {showRow && (
        <Row className="flex flex-column">
          <Col xs="12" sm="6" className="mb-3">
            <div className="custom-file">
              <input type="file" className="custom-file-input" id="image" onChange={handleFileChange} />
            </div>
          </Col>
          <Col xs="12" sm="6">
            <Button color="primary" block onClick={handleImageUpload} disabled={!selectedImage}>
              Upload New Image
            </Button>
          </Col>
        </Row>
      )}
      <div>
        {attachmentList && attachmentList.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {attachmentList.map((attachment, i) => (
              <div key={i} style={{ margin: '5px', width: '10%', cursor: 'pointer' }}>
                <img
                  alt={attachment.name}
                  src={attachment.url}
                  style={{ width: '100%', height: 'auto' }}
                  onClick={() => handleThumbnailClick(attachment)}
                />
                <td>
                  {attachment.item ? (
                    <Link to={`/item/${attachment.item.id}`}>{attachment.item.id}</Link>
                  ) : (
                    ''
                  )}
                </td>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="alert alert-warning">
              <Translate contentKey="tempApp.attachment.home.notFound">No Attachments found</Translate>
            </div>
          )
        )}
        {selectedThumbnailImage && (
          <Modal isOpen={true} toggle={() => setSelectedThumbnailImage(null)}>
            <div style={{ padding: '20px' }}>
              <img src={selectedThumbnailImage.url} alt="Selected Image" style={{ maxWidth: '100%', maxHeight: '500px' }} />
              <div>
                <h5>Name: {selectedThumbnailImage.name}</h5>
                <p>Size: {selectedThumbnailImage.size} bytes</p>
                <p>Type: {selectedThumbnailImage.type}</p>
              </div>
              <Button color="secondary" onClick={() => setSelectedThumbnailImage(null)}>
                Close
              </Button>
            </div>
          </Modal>
        )}
      </div>

      {totalItems ? (
        <div className={attachmentList && attachmentList.length > 0 ? '' : 'd-none'}>
          <div className="justify-content-center d-flex">
            <JhiItemCount page={paginationState.activePage} total={totalItems} itemsPerPage={paginationState.itemsPerPage} i18nEnabled />
          </div>
          <div className="justify-content-center d-flex">
            <JhiPagination
              activePage={paginationState.activePage}
              onSelect={handlePagination}
              maxButtons={5}
              itemsPerPage={paginationState.itemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default Attachment;
