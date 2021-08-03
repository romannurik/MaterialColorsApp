/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';
import React, { forwardRef, useContext, useLayoutEffect, useState } from 'react';
import { colorverse, displayLabelForHue, GlobalContext } from './app';
import { SearchIcon } from './icons';
import styles from './sidebar.module.scss';

/**
 * Renders the sidebar
 */
export const Sidebar = forwardRef((props, ref) => {
  let { selectedView, setSelectedView, resize } = useContext(GlobalContext);
  let [activeNamespace, setActiveNamespace] = useState(
    Object.entries(colorverse)
      .filter(([, { pinned }]) => !pinned)
      .map(([key]) => key)[0]);

  useLayoutEffect(() => void resize(), [activeNamespace]);

  let pinnedNamespaces = Object.entries(colorverse).filter(([, { pinned }]) => !!pinned);
  let unpinnedNamespaces = Object.entries(colorverse).filter(([, { pinned }]) => !pinned);

  return <div ref={ref} className={styles.sidebar}>
    <button className={cn(styles.searchButton, { [styles.isSelected]: selectedView.type === 'search' })}
      onClick={() => setSelectedView({ type: 'search' })}>
      <SearchIcon className={styles.searchIcon} />
      <div className={styles.tooltip}>Search</div>
    </button>
    {/* Pinned namespaces (always show) */}
    {pinnedNamespaces.map(([namespace, { colors }]) =>
      <React.Fragment key={namespace}>
        <div className={styles.separator} />
        <SidebarHuesList namespace={namespace} colors={colors} />
      </React.Fragment>)}
    {/* List of unpinned namespaces (show one at a time, only if there's more than one) */}
    <div className={styles.separator} />
    {unpinnedNamespaces.length > 1 && unpinnedNamespaces.map(([namespace, { shorthand, label }]) =>
      <button key={namespace}
        className={cn(styles.namespace, {
          [styles.isSelected]: activeNamespace === namespace
        })}
        onClick={() => setActiveNamespace(namespace)}>
          {shorthand.startsWith('svgpath:')
            ? <svg className={styles.namespaceIcon} width="24" height="24" viewBox="0 0 24 24"><path d={shorthand.replace(/^svgpath:/, '')} /></svg>
            : <div className={styles.namespaceShorthand}>{shorthand}</div>}
        <div className={styles.tooltip}>{label}</div>
      </button>)}
    {/* Active unpinned namespace */}
    {activeNamespace && <SidebarHuesList
      namespace={activeNamespace}
      colors={colorverse[activeNamespace].colors} />}
  </div>;
});

/**
 * Renders a list of hue buttons in the sidebar
 */
export function SidebarHuesList({ namespace, colors }) {
  let { isDarkMode, selectedView, setSelectedView } = useContext(GlobalContext);
  return <>{Object.entries(colors).map(([hue, hueObj]) =>
    <button key={hue} className={cn(styles.hue, {
      [styles.isSelected]: selectedView.hue === hue && selectedView.namespace === namespace
    })}
      onClick={() => setSelectedView({ type: 'hue', namespace, hue })}>
      <div className={styles.hueIcon}
        style={{
          backgroundColor: 'currentColor',
          color: isDarkMode
            ? hueObj._selectorDark || hueObj['300'].hex
            : hueObj._selectorLight || hueObj['500'].hex
        }}>
        <div className={styles.ring} style={{ backgroundColor: 'currentColor' }} />
      </div>
      <div className={styles.tooltip}>
        {displayLabelForHue(hue)}
      </div>
    </button>
  )}</>;
}
