import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useClipboard } from 'use-clipboard-copy'
import { useTranslation } from 'next-i18next'

import { getBaseUrl } from '../utils/getBaseUrl'
import { formatModifiedDateTime } from '../utils/fileDetails'
import { getReadablePath } from '../utils/getReadablePath'
import { Checkbox, ChildIcon, ChildName, Downloading } from './FileListing'

const GridItem = ({ c, path }: { c: OdFolderChildren; path: string }) => {
  // We use the generated medium thumbnail for rendering preview images (excluding folders)
  const thumbnailUrl = 'folder' in c ? null : `/api/thumbnail?path=${path}&size=medium`

  // Some thumbnails are broken, so we check for onerror event in the image component
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  return (
    <div className="space-y-2">
      <div className="h-32 overflow-hidden rounded border border-gray-900/10 dark:border-gray-500/30">
        {thumbnailUrl && !brokenThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover object-top"
            src={thumbnailUrl}
            alt={c.name}
            onError={() => setBrokenThumbnail(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center rounded-lg">
            <ChildIcon child={c} />
            <span className="absolute bottom-0 right-0 m-1 font-medium text-gray-700 dark:text-gray-500">
              {c.folder?.childCount}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-center space-x-2">
        <span className="w-5 flex-shrink-0 text-center">
          <ChildIcon child={c} />
        </span>
        <ChildName name={c.name} />
      </div>
      <div className="truncate text-center font-mono text-xs text-gray-700 dark:text-gray-500">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
    </div>
  )
}

const FolderGridLayout = ({
  path,
  folderChildren,
  selected,
  toggleItemSelected,
  totalSelected,
  toggleTotalSelected,
  totalGenerating,
  handleSelectedDownload,
  folderGenerating,
  handleFolderDownload,
  toast,
}) => {
  const clipboard = useClipboard()

  const { t } = useTranslation()

  // Get item path from item name
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`

  return (
    <div className="rounded bg-white dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center border-b border-gray-900/10 px-3 text-xs font-bold uppercase tracking-widest text-gray-600 dark:border-gray-500/30 dark:text-gray-400">
        <div className="flex-1">{t('{{count}} item(s)', { count: folderChildren.length })}</div>
        <div className="flex p-1.5 text-gray-700 dark:text-gray-400">
          <Checkbox
            checked={totalSelected}
            onChange={toggleTotalSelected}
            indeterminate={true}
            title={t('Select all files')}
          />
          {totalGenerating ? (
            <Downloading title={t('Downloading selected files, refresh page to cancel')} />
          ) : (
            <button
              title={t('Download selected files')}
              className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
              disabled={totalSelected === 0}
              onClick={handleSelectedDownload}
            >
              <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} size="lg" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
        {folderChildren.map((c: OdFolderChildren) => (
          <div
            key={c.id}
            className="group relative overflow-hidden rounded transition-all duration-100 hover:bg-gray-100 dark:hover:bg-gray-850"
          >
            <div className="absolute top-0 right-0 z-10 m-1 rounded bg-white/50 py-0.5 opacity-0 transition-all duration-100 group-hover:opacity-100 dark:bg-gray-900/50">
              {c.folder ? (
                <div>
                  <span
                    title={t('Copy folder permalink')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => {
                      clipboard.copy(`${getBaseUrl()}${getReadablePath(getItemPath(c.name))}`)
                      toast(t('Copied folder permalink.'), { icon: '👌' })
                    }}
                  >
                    <FontAwesomeIcon icon={['far', 'copy']} />
                  </span>
                  {folderGenerating[c.id] ? (
                    <Downloading title={t('Downloading folder, refresh page to cancel')} />
                  ) : (
                    <span
                      title={t('Download folder')}
                      className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={handleFolderDownload(getItemPath(c.name), c.id, c.name)}
                    >
                      <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <span
                    title={t('Copy raw file permalink')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => {
                      clipboard.copy(`${getBaseUrl()}/api?path=${getReadablePath(getItemPath(c.name))}&raw=true`)
                      toast.success(t('Copied raw file permalink.'))
                    }}
                  >
                    <FontAwesomeIcon icon={['far', 'copy']} />
                  </span>
                  <a
                    title={t('Download file')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    href={c['@microsoft.graph.downloadUrl']}
                  >
                    <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                  </a>
                </div>
              )}
            </div>

            <div
              className={`${
                selected[c.id] ? 'opacity-100' : 'opacity-0'
              } absolute top-0 left-0 z-10 m-1 rounded bg-white/50 py-0.5 group-hover:opacity-100 dark:bg-gray-900/50`}
            >
              {!c.folder && !(c.name === '.password') && (
                <Checkbox
                  checked={selected[c.id] ? 2 : 0}
                  onChange={() => toggleItemSelected(c.id)}
                  title={t('Select file')}
                />
              )}
            </div>

            <Link href={getItemPath(c.name)} passHref>
              <a>
                <GridItem c={c} path={getItemPath(c.name)} />
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FolderGridLayout
