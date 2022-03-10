interface DataTransferItem extends DataTransferItem {
  getAsFileSystemHandle?(): Promise<FileSystemFileHandle|FileSystemDirectoryHandle>;
  webkitGetAsEntry?(): FileSystemEntry | null;
}