import { useCallback } from 'react';
import {
  useAppDispatch,
  useAppSelector,
  selectCollections,
  selectFiles,
  selectStorageStatus,
  selectSelectedFileId,
  selectSelectedCollectionId,
} from '../store/hooks.js';
import {
  createCollection as createColAction,
  renameCollection as renameColAction,
  deleteCollection as deleteColAction,
  createFile as createFileAction,
  updateFile as updateFileAction,
  renameFile as renameFileAction,
  deleteFile as deleteFileAction,
  moveFile as moveFileAction,
  selectFile as selectFileAction,
  selectCollection as selectColAction,
} from '../store/slices/notesSlice.js';

export function useAppState() {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectCollections);
  const files = useAppSelector(selectFiles);
  const selectedFileId = useAppSelector(selectSelectedFileId);
  const selectedCollectionId = useAppSelector(selectSelectedCollectionId);
  const storageStatus = useAppSelector(selectStorageStatus);

  const createCollection = useCallback(
    (name, parentId = null) => {
      dispatch(createColAction({ name, parentId }));
    },
    [dispatch]
  );

  const renameCollection = useCallback(
    (id, newName) => {
      dispatch(renameColAction({ id, newName }));
    },
    [dispatch]
  );

  const deleteCollection = useCallback(
    (id) => {
      dispatch(deleteColAction(id));
    },
    [dispatch]
  );

  const createFile = useCallback(
    (name, collectionId) => {
      dispatch(createFileAction({ name, collectionId }));
    },
    [dispatch]
  );

  const updateFile = useCallback(
    (id, updates) => {
      dispatch(updateFileAction({ id, updates }));
    },
    [dispatch]
  );

  const renameFile = useCallback(
    (id, newName) => {
      dispatch(renameFileAction({ id, newName }));
    },
    [dispatch]
  );

  const deleteFile = useCallback(
    (id) => {
      dispatch(deleteFileAction(id));
    },
    [dispatch]
  );

  const moveFile = useCallback(
    (fileId, targetCollectionId) => {
      dispatch(moveFileAction({ fileId, targetCollectionId }));
    },
    [dispatch]
  );

  const selectFile = useCallback(
    (id) => {
      dispatch(selectFileAction(id));
    },
    [dispatch]
  );

  const selectCollection = useCallback(
    (id) => {
      dispatch(selectColAction(id));
    },
    [dispatch]
  );

  return {
    collections,
    files,
    selectedFileId,
    selectedCollectionId,
    storageStatus,
    openPcNotesFolder: null,
    createCollection,
    renameCollection,
    deleteCollection,
    createFile,
    updateFile,
    renameFile,
    deleteFile,
    moveFile,
    selectFile,
    selectCollection,
  };
}
