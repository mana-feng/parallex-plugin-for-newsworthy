<template>
  <div class="storage-manager">
    <div class="manager-header">
      <h2>📚 Storage Manager</h2>
      <button @click="closeManager" class="close-btn">✕</button>
    </div>

    <div class="github-status" :class="{ connected: githubConnected }">
      <span class="status-icon">{{ githubConnected ? '✓' : '⚠' }}</span>
      <span>GitHub Pages: {{ githubConnected ? 'Connected' : 'Not Configured' }}</span>
      <span v-if="githubConnected" class="github-info">
        ({{ githubOwner }}/{{ githubRepo }})
      </span>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="🔍 Search pages..."
          @input="handleSearch"
        />
      </div>
      <PullAllButton :githubConnected="githubConnected" @success="loadPages" />
      <button @click="showGroupDialog = true" class="btn btn-primary">
        ➕ New Group
      </button>
    </div>

    <div class="pages-section">
      <div class="section-header">
        <h3>Pages ({{ pages.length }})</h3>
        <div class="filter-controls">
          <div class="filter-dropdown" v-if="groups.length > 0">
            <div class="dropdown-trigger" @click="toggleGroupDropdown" :class="{ open: isGroupDropdownOpen }">
              <div class="selected-group">
                <span class="filter-icon">🏷️</span>
                <span class="group-text">
                  <span v-if="filterGroupId === null" class="all-text">All Groups</span>
                  <span v-else class="group-name">
                    <span class="color-dot" :style="{ backgroundColor: selectedGroup?.color }"></span>
                    {{ selectedGroup?.name }}
                  </span>
                </span>
              </div>
              <span class="dropdown-arrow">▼</span>
            </div>
            
            <transition name="dropdown">
              <div v-if="isGroupDropdownOpen" class="dropdown-menu">
                <div 
                  class="dropdown-item" 
                  :class="{ active: filterGroupId === null }"
                  @click="selectGroupFromDropdown(null)"
                >
                  <span class="item-icon">📚</span>
                  <span class="item-text">All Groups</span>
                  <span class="item-count">{{ totalPagesCount }}</span>
                </div>
                <div class="dropdown-divider"></div>
                <div 
                  v-for="group in groups" 
                  :key="group.id"
                  class="dropdown-item"
                  :class="{ active: filterGroupId === group.id }"
                  @click="selectGroupFromDropdown(group.id)"
                >
                  <span class="color-dot" :style="{ backgroundColor: group.color }"></span>
                  <span class="item-text">{{ group.name }}</span>
                  <span class="item-count">{{ group.page_count }}</span>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item manage-item" @click="openGroupManager">
                  <span class="item-icon">⚙️</span>
                  <span class="item-text">Manage Groups</span>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- Smart Sync Button -->
          <button 
            v-if="githubConnected"
            @click="handleSmartSync" 
            :disabled="isSyncingGroups"
            class="btn-smart-sync"
            :class="{ syncing: isSyncingGroups }"
            title="Smart sync: merge local and GitHub groups, upload only if changed"
          >
            <span class="sync-icon">{{ isSyncingGroups ? '⏳' : '🔄' }}</span>
          </button>
        </div>

        <div class="view-options">
          <button 
            @click="generateAllThumbnails" 
            :disabled="isGeneratingThumbnails"
            class="btn-generate-thumbnails"
            :class="{ loading: isGeneratingThumbnails }"
            title="Generate thumbnails for all pages"
          >
            {{ isGeneratingThumbnails ? '⏳ Generating...' : '🖼️ Generate Thumbnails' }}
          </button>
          <button 
            @click="viewMode = 'grid'" 
            :class="{ active: viewMode === 'grid' }"
            class="icon-btn"
          >
            ⊞
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="{ active: viewMode === 'list' }"
            class="icon-btn"
          >
            ☰
          </button>
        </div>
      </div>

      <div v-if="pages.length === 0" class="empty-state">
        <p>📄 No pages yet. Create your first page in the editor!</p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="pages-grid">
        <div 
          v-for="page in pages" 
          :key="page.id" 
          class="page-card"
          draggable="true"
          @dragstart="handleDragStart($event, page)"
          @dragover.prevent
          @drop="handleDrop($event, page)"
        >
          <div class="page-preview" v-if="page.preview_image">
            <img :src="page.preview_image" :alt="page.title" />
          </div>
          <div class="page-preview placeholder" v-else>
            <span>📄</span>
          </div>
          <div class="page-info">
            <h4>
              <SyncStatusBadge :sync-status="page.sync_status || 'local-only'" />
              {{ page.title }}
              <EditableStatusBadge 
                :sections-data="page.sections_data"
                :html-content="page.html_content"
              />
            </h4>
            <div class="page-meta">
              <span v-if="page.group_name" class="group-badge" :style="{ backgroundColor: page.group_color }">
                {{ page.group_name }}
              </span>
              <span class="date">{{ formatDate(page.updated_at) }}</span>
            </div>
            <div class="page-actions">
              <button @click="openPage(page)" class="icon-btn" title="Open">🔗</button>
              <button @click="copyIframeCode(page, $event)" class="icon-btn" title="Copy Iframe Code">📋</button>
              <button @click="editPage(page)" class="icon-btn" title="Edit Content">✏️</button>
              <button 
                v-if="!page.github_url || githubConnected" 
                @click="uploadPageToGitHub(page)" 
                class="icon-btn" 
                title="Upload to GitHub"
                :disabled="!githubConnected"
              >
                📤
              </button>
              <button @click="deletePage(page.id)" class="icon-btn delete" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="pages-list">
        <div 
          v-for="page in pages" 
          :key="page.id" 
          class="page-row"
          draggable="true"
          @dragstart="handleDragStart($event, page)"
          @dragover.prevent
          @drop="handleDrop($event, page)"
        >
          <div class="page-row-content">
            <span class="drag-handle">⋮⋮</span>
            <div class="page-main">
              <h4>
                <SyncStatusBadge :sync-status="page.sync_status || 'local-only'" />
                {{ page.title }}
                <EditableStatusBadge 
                  :sections-data="page.sections_data"
                  :html-content="page.html_content"
                />
              </h4>
              <span class="filename">{{ page.filename }}</span>
            </div>
            <span v-if="page.group_name" class="group-badge" :style="{ backgroundColor: page.group_color }">
              {{ page.group_name }}
            </span>
            <span class="date">{{ formatDate(page.updated_at) }}</span>
            <div class="page-actions">
              <button @click="openPage(page)" class="icon-btn" title="Open">🔗</button>
              <button @click="copyIframeCode(page, $event)" class="icon-btn" title="Copy Iframe Code">📋</button>
              <button @click="editPage(page)" class="icon-btn" title="Edit Content">✏️</button>
              <button 
                v-if="!page.github_url || githubConnected" 
                @click="uploadPageToGitHub(page)" 
                class="icon-btn" 
                title="Upload to GitHub"
                :disabled="!githubConnected"
              >
                📤
              </button>
              <button @click="deletePage(page.id)" class="icon-btn delete" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showGroupDialog" class="modal-overlay" @click.self="closeGroupDialog">
      <div class="modal-container group-manager-modal">
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon">📁</div>
            <div>
              <h3>Manage Groups</h3>
              <p class="modal-subtitle">Organize your pages into groups for better management</p>
            </div>
          </div>
          <button class="modal-close" @click="closeGroupDialog">×</button>
        </div>
        
        <div class="group-form-section">
          <h4>{{ editingGroup ? 'Edit Group' : 'Create New Group' }}</h4>
          <form @submit.prevent="saveGroup">
            <div class="form-row">
              <div class="form-group">
                <label>Group Name *</label>
                <input v-model="groupForm.name" type="text" required />
              </div>
              <div class="form-group">
                <label>Color</label>
                <input v-model="groupForm.color" type="color" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="groupForm.description" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button v-if="editingGroup" type="button" @click="cancelEditGroup" class="btn btn-secondary">
                Cancel Edit
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingGroup ? '✓ Update' : '➕ Create' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Groups List -->
        <div class="groups-list-section" v-if="groups.length > 0">
          <h4>Existing Groups ({{ groups.length }})</h4>
          <div class="groups-list">
            <div 
              v-for="group in groups" 
              :key="group.id"
              class="group-item"
              :class="{ editing: editingGroup && editingGroup.id === group.id }"
            >
              <div class="group-color-bar" :style="{ backgroundColor: group.color }"></div>
              <div class="group-info">
                <strong>{{ group.name }}</strong>
                <span class="group-desc">{{ group.description || 'No description' }}</span>
                <span class="group-count">{{ group.page_count }} pages</span>
              </div>
              <div class="group-item-actions">
                <button @click="editGroup(group)" class="icon-btn" title="Edit">✏️</button>
                <button @click="deleteGroup(group.id)" class="icon-btn delete" title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" @click="closeGroupDialog" class="modal-btn modal-btn-cancel">
            <span class="btn-icon">✕</span>
            Close
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPageDialog" class="modal-overlay" @click.self="closePageDialog">
      <div class="modal-container page-edit-modal">
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon">📝</div>
            <div>
              <h3>Edit Page Metadata</h3>
              <p class="modal-subtitle">Update page title, filename, and group settings</p>
            </div>
          </div>
          <button class="modal-close" @click="closePageDialog">×</button>
        </div>
        <div class="modal-body">
        <form @submit.prevent="savePage">
          <div class="form-group">
            <label>Title *</label>
            <input v-model="pageForm.title" type="text" required />
          </div>
          <div class="form-group">
            <label>Filename *</label>
            <input v-model="pageForm.filename" type="text" required />
          </div>
          <div class="form-group">
            <label>Group</label>
            <select v-model="pageForm.group_id">
              <option :value="null">No Group</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
          
          <!-- Edit HTML Content Button -->
          <div v-if="editingPage && (editingPage.sections_data || editingPage.html_content)" class="edit-content-section">
            <button type="button" @click="editHtmlContent" class="btn btn-edit-content">
              ✏️ Edit HTML Content
            </button>
            <p class="help-text">
              Open this page in the visual editor to modify its content
            </p>
          </div>
        </form>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closePageDialog" class="modal-btn modal-btn-cancel">
            <span class="btn-icon">✕</span>
            Cancel
          </button>
          <button type="submit" @click="savePage" class="modal-btn modal-btn-confirm">
            <span class="btn-icon">✓</span>
            Update Metadata
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useEditorStore } from '../stores/editorStore';
import { parseHtmlToSections, isEditableHtml } from '../utils/parseHtml';
import * as dialog from '@/utils/dialog';
import { showCopyText } from '@/utils/inputModal';
import PullAllButton from './storage/PullAllButton.vue';
import SyncStatusBadge from './storage/SyncStatusBadge.vue';
import EditableStatusBadge from './storage/EditableStatusBadge.vue';
import {
  getGitHubStatus,
  getGitHubSettings,
  getGroups,
  getPages,
  createGroup,
  updateGroup,
  deleteGroup as deleteGroupAPI,
  syncGroupsPush,
  syncGroupsPull,
  syncGroupsSmart,
  getPage,
  updatePage,
  uploadPageToGitHub as uploadPageToGitHubAPI,
  deletePage as deletePageAPI,
  reorderPages
} from '@/services/apiService';

const editorStore = useEditorStore();

// State
const githubConnected = ref(false);
const githubOwner = ref('');
const githubRepo = ref('');
const groups = ref([]);
const pages = ref([]);
const allPagesCount = ref(0); // Total count of all pages (unfiltered)
const searchQuery = ref('');
const filterGroupId = ref(null);
const viewMode = ref('grid');
const showGroupDialog = ref(false);
const showPageDialog = ref(false);
const editingGroup = ref(null);
const editingPage = ref(null);
const draggedPage = ref(null);
const isGroupDropdownOpen = ref(false);
const isGeneratingThumbnails = ref(false);
const isSyncingGroups = ref(false);

const groupForm = ref({
  name: '',
  description: '',
  color: '#3b82f6'
});

const pageForm = ref({
  title: '',
  filename: '',
  group_id: null
});

const emit = defineEmits(['close']);

// Computed
const selectedGroup = computed(() => {
  if (filterGroupId.value === null) return null;
  return groups.value.find(g => g.id === filterGroupId.value);
});

const totalPagesCount = computed(() => {
  // Return the total count of all pages (including ungrouped pages)
  return allPagesCount.value;
});

// Methods
// Helper function to build full GitHub URL from relative path
function buildGitHubUrl(relativePath) {
  if (!relativePath || !githubOwner.value || !githubRepo.value) {
    return null;
  }
  // If it's already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  // Build full URL from relative path
  return `https://${githubOwner.value}.github.io/${githubRepo.value}/${relativePath}`;
}

async function checkGitHubStatus() {
  try {
    const result = await getGitHubStatus();
    if (result.ok) {
      githubConnected.value = result.data.configured;
      githubOwner.value = result.data.owner || '';
      githubRepo.value = result.data.repo || '';
    }
  } catch (error) {
    console.error('Failed to check GitHub status:', error);
  }
}

async function loadGroups() {
  try {
    const result = await getGroups();
    if (result.ok) {
      // Force reactive update by creating a new array instead of direct assignment
      groups.value = [...result.data];
    }
  } catch (error) {
    console.error('Failed to load groups:', error);
  }
}

async function loadAllPagesCount() {
  try {
    // Load total count of all pages without filters
    const result = await getPages();
    if (result.ok) {
      allPagesCount.value = result.data.length;
    }
  } catch (error) {
    console.error('Failed to load all pages count:', error);
  }
}

async function loadPages() {
  try {
    const filters = {};
    if (filterGroupId.value) {
      filters.group_id = filterGroupId.value;
    }
    if (searchQuery.value) {
      filters.search = searchQuery.value;
    }
    
    const result = await getPages(filters);
    if (result.ok) {
      pages.value = result.data;
    }
    
    // Always update the total count to reflect current state
    await loadAllPagesCount();
  } catch (error) {
    console.error('Failed to load pages:', error);
  }
}

function handleSearch() {
  loadPages();
}

function editGroup(group) {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    color: group.color || '#3b82f6'
  };
  showGroupDialog.value = true;
}

async function saveGroup() {
  try {
    const result = editingGroup.value
      ? await updateGroup(editingGroup.value.id, groupForm.value)
      : await createGroup(groupForm.value);
    
    if (result.ok) {
      await loadGroups();
      closeGroupDialog();
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Save Group'
      });
    }
  } catch (error) {
    console.error('Failed to save group:', error);
    await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
      title: 'Failed to Save Group'
    });
  }
}

async function deleteGroup(id) {
  const confirmed = await dialog.danger(
    'Are you sure you want to delete this group?\n\nPages in this group will not be deleted.',
    {
      title: 'Delete Group',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
  if (!confirmed) {
    return;
  }
  
  try {
    const result = await deleteGroupAPI(id);
    
    if (result.ok) {
      await loadGroups();
      await loadPages();
      await dialog.success('The group has been removed.\n\nPages are still available.', {
        title: 'Group Deleted',
        icon: '🗑️'
      });
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Delete Group'
      });
    }
  } catch (error) {
    console.error('Failed to delete group:', error);
    await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
      title: 'Failed to Delete Group'
    });
  }
}

// GitHub Groups Sync Functions
async function pushGroupsToGitHub() {
  if (!githubConnected.value) {
    await dialog.warning('Please configure your GitHub settings first to enable syncing.', {
      title: 'GitHub Not Configured',
      icon: '⚠️'
    });
    return;
  }

  isSyncingGroups.value = true;
  try {
    const result = await syncGroupsPush();
    
    if (result.ok) {
      await dialog.success('Your groups have been successfully uploaded to GitHub.', {
        title: 'Groups Synced to GitHub!',
        icon: '✅'
      });
    } else {
      await dialog.error(result.error || 'Failed to sync groups', {
        title: 'Failed to Sync Groups'
      });
    }
  } catch (error) {
    console.error('Failed to push groups to GitHub:', error);
    await dialog.error(error.message || 'Unable to upload groups to GitHub. Please try again.', {
      title: 'Failed to Sync Groups'
    });
  } finally {
    isSyncingGroups.value = false;
  }
}

async function pullGroupsFromGitHub() {
  if (!githubConnected.value) {
    await dialog.warning('Please configure your GitHub settings first to enable syncing.', {
      title: 'GitHub Not Configured',
      icon: '⚠️'
    });
    return;
  }

  const confirmed = await dialog.confirm(
    'Pull groups from GitHub?\n\nThis will update your local groups with the latest data from GitHub.',
    {
      title: 'Pull Groups',
      icon: '📥',
      confirmText: 'Pull',
      cancelText: 'Cancel'
    }
  );
  if (!confirmed) {
    return;
  }

  isSyncingGroups.value = true;
  try {
    const result = await syncGroupsPull();
    
    if (result.ok) {
      await loadGroups();
      
      if (result.data.stats) {
        const msg = `Created: ${result.data.stats.created}\nUpdated: ${result.data.stats.updated}\nSkipped: ${result.data.stats.skipped}`;
        await dialog.success(msg, {
          title: 'Groups Synced from GitHub!',
          icon: '📥'
        });
      } else {
        await dialog.info('No groups were found in your GitHub repository.', {
          title: 'No Groups Found',
          icon: 'ℹ️'
        });
      }
    } else {
      await dialog.error(result.error || 'Failed to pull groups', {
        title: 'Failed to Pull Groups'
      });
    }
  } catch (error) {
    console.error('Failed to pull groups from GitHub:', error);
    await dialog.error(error.message || 'Unable to download groups from GitHub. Please try again.', {
      title: 'Failed to Pull Groups'
    });
  } finally {
    isSyncingGroups.value = false;
  }
}

// Smart sync: Export local → Pull GitHub → Merge → Compare → Upload if changed
async function handleSmartSync() {
  if (!githubConnected.value) {
    await dialog.warning('Please configure your GitHub settings first to enable syncing.', {
      title: 'GitHub Not Configured',
      icon: '⚠️'
    });
    return;
  }

  isSyncingGroups.value = true;
  try {
    const result = await syncGroupsSmart();
    
    if (!result.ok) {
      await dialog.error(result.error || 'Smart sync failed', {
        title: 'Sync Failed'
      });
      return;
    }

    // Reload groups to show any merged changes
    await loadGroups();

    if (result.data.action === 'no_change') {
      // No changes - silent success or minimal notification
      await dialog.success('Your groups are already up to date with GitHub.', {
        title: 'Already in Sync',
        icon: '✅'
      });
    } else if (result.data.action === 'synced') {
      // Changes were synced
      const stats = result.data.stats;
      let msg = '';
      
      if (stats.import) {
        msg += `Local: ${stats.local} groups\n`;
        msg += `GitHub: ${stats.github} groups\n`;
        msg += `Merged: ${stats.merged} groups\n\n`;
        msg += `Import results:\n`;
        msg += `  Created: ${stats.import.created}\n`;
        msg += `  Updated: ${stats.import.updated}\n`;
        msg += `  Skipped: ${stats.import.skipped}`;
      } else {
        msg += `Total groups: ${stats.merged}`;
      }
      
      await dialog.success(msg, {
        title: 'Groups Synced Successfully!',
        icon: '🔄'
      });
    }
  } catch (error) {
    console.error('Smart sync failed:', error);
    await dialog.error(error.message || 'Unable to sync groups with GitHub. Please try again.', {
      title: 'Sync Failed'
    });
  } finally {
    isSyncingGroups.value = false;
  }
}

// Edit page - always show metadata dialog first
function editPage(page) {
  editingPage.value = page;
  pageForm.value = {
    title: page.title,
    filename: page.filename,
    group_id: page.group_id
  };
  showPageDialog.value = true;
}

// Edit HTML content - load to editor if has sections_data, otherwise try to parse HTML
async function editHtmlContent() {
  const page = editingPage.value;
  
  // Close metadata dialog first
  closePageDialog();
  
  // If page has sections data, load it into the editor
  if (page.sections_data) {
    try {
      // Confirm before loading (will clear current editor content)
      if (editorStore.sections.length > 0) {
        const confirmed = await dialog.warning(
          'Loading this page will replace your current editor content.\n\nDo you want to continue?',
          {
            title: 'Replace Editor Content',
            icon: '⚠️',
            confirmText: 'Load Page',
            cancelText: 'Cancel'
          }
        );
        if (!confirmed) {
          return;
        }
      }
      
      // Load sections data into editor with page info for update functionality
      editorStore.loadSections(page.sections_data, {
        filename: page.filename,
        title: page.title
      });
      
      // Close storage manager
      closeManager();
      
      // Show success message
      await dialog.success(`"${page.title}" is now ready to edit.\n\nUse the "Update" button to save any changes.`, {
        title: 'Page Loaded Successfully!',
        icon: '📄'
      });
      
    } catch (error) {
      console.error('Failed to load page to editor:', error);
      await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Load Page'
      });
    }
  } else if (page.html_content && isEditableHtml(page.html_content)) {
    // Try to parse HTML and convert to sections
    try {
      // Confirm before loading
      if (editorStore.sections.length > 0) {
        const confirmed = await dialog.warning(
          'This page will be converted from HTML to editable format.\n\nThis will replace your current editor content.\n\nDo you want to continue?',
          {
            title: 'Convert HTML Page',
            icon: '🔄',
            confirmText: 'Convert & Load',
            cancelText: 'Cancel'
          }
        );
        if (!confirmed) {
          return;
        }
      }
      
      // Parse HTML to sections
      const sections = parseHtmlToSections(page.html_content);
      
      if (sections.length === 0) {
        throw new Error('No valid sections found in HTML');
      }
      
      // Load parsed sections into editor with page info for update functionality
      editorStore.loadSections(sections, {
        filename: page.filename,
        title: page.title
      });
      
      // Close storage manager
      closeManager();
      
      // Show success message
      await dialog.success(`"${page.title}" converted successfully!\n\n${sections.length} section(s) were recovered from the HTML.\n\nYou can now edit and use the "Update" button to save changes.`, {
        title: 'Conversion Complete',
        icon: '🔄'
      });
      
    } catch (error) {
      console.error('Failed to parse HTML:', error);
      await dialog.error(`Error: ${error.message}\n\nThis page cannot be edited in the visual editor. Try downloading it instead.`, {
        title: 'Unable to Convert Page'
      });
    }
  } else {
    // No sections data and HTML is not editable
    await dialog.error('This page doesn\'t have editable content.\n\nOnly pages created in the visual editor can be edited.', {
      title: 'Page Not Editable'
    });
  }
}

async function savePage() {
  try {
    const result = await updatePage(editingPage.value.id, pageForm.value);
    
    if (result.ok) {
      await loadPages();
      await loadGroups(); // Reload group list to update page count
      closePageDialog();
      await dialog.success(`"${pageForm.value.title}" has been saved with your latest changes.`, {
        title: 'Page Updated Successfully!',
        icon: '✅'
      });
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Update Page'
      });
    }
  } catch (error) {
    console.error('Failed to save page:', error);
    await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
      title: 'Failed to Update Page'
    });
  }
}

async function uploadPageToGitHub(page) {
  if (!githubConnected.value) {
    await dialog.warning('Please configure your GitHub Pages settings first to enable uploading.', {
      title: 'GitHub Not Configured',
      icon: '⚠️'
    });
    return;
  }

  const confirmed = await dialog.confirm(
    `Upload "${page.title}" to GitHub?\n\nThis will upload the page and all its images to GitHub Pages.`,
    {
      title: 'Upload to GitHub',
      icon: '📤',
      confirmText: 'Upload',
      cancelText: 'Cancel'
    }
  );
  if (!confirmed) {
    return;
  }

  try {
    const result = await uploadPageToGitHubAPI(page.id);
    
    if (result.ok) {
      await loadPages();
      
      const data = result.data;
      const configResult = await getGitHubSettings();
      let fullUrl = data.github_url;
      if (configResult.ok && configResult.data.configured && configResult.data.config) {
        const { owner, repo } = configResult.data.config;
        if (owner && repo && !fullUrl.startsWith('http')) {
          fullUrl = `https://${owner}.github.io/${repo}/${data.github_url}`;
        }
      }
      
      let message = `"${page.title}" has been successfully uploaded to GitHub!`;
      if (data.images_uploaded > 0) {
        message += `\n\n📤 Uploaded ${data.images_uploaded} image(s)`;
      }
      if (fullUrl && fullUrl.startsWith('http')) {
        message += `\n\n🔗 ${fullUrl}`;
      }
      
      await dialog.success(message, {
        title: 'Upload Successful!',
        icon: '✅'
      });
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Upload Page'
      });
    }
  } catch (error) {
    console.error('Failed to upload page:', error);
    await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
      title: 'Failed to Upload Page'
    });
  }
}

async function deletePage(id) {
  const confirmed = await dialog.danger(
    'Are you sure you want to delete this page?\n\nThis will remove it from both your database and GitHub Pages.',
    {
      title: 'Delete Page',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
  if (!confirmed) {
    return;
  }
  
  try {
    const result = await deletePageAPI(id);
    
    if (result.ok) {
      await loadPages();
      await loadGroups(); // Reload group list to update page count
      await dialog.success('The page has been removed from your database and GitHub Pages.', {
        title: 'Page Deleted',
        icon: '🗑️'
      });
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Delete Page'
      });
    }
  } catch (error) {
    console.error('Failed to delete page:', error);
    await dialog.error(error.message || 'An unexpected error occurred. Please try again.', {
      title: 'Failed to Delete Page'
    });
  }
}

async function openPage(page) {
  const fullUrl = buildGitHubUrl(page.github_url);
  if (fullUrl) {
    window.open(fullUrl, '_blank');
  } else {
    await dialog.warning('This page hasn\'t been published to GitHub Pages yet.\n\nSave it first to get a live URL.', {
      title: 'Page Not Published Yet',
      icon: '⚠️'
    });
  }
}


async function copyIframeCode(page, event) {
  const fullUrl = buildGitHubUrl(page.github_url);
  if (!fullUrl) {
    await dialog.warning('This page hasn\'t been published to GitHub Pages yet.\n\nSave it first to get an embed code.', {
      title: 'Page Not Published Yet',
      icon: '⚠️'
    });
    return;
  }
  
  const iframeCode = `<iframe 
  src="${fullUrl}" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  title="${page.title}">
</iframe>`;
  
  try {
    await navigator.clipboard.writeText(iframeCode);
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✓';
    button.style.background = '#10b981';
    button.style.color = 'white';
    button.style.borderColor = '#10b981';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
  } catch (error) {
    console.error('Failed to copy iframe code:', error);
    showCopyText(iframeCode, 'Copy Iframe Code');
  }
}

function handleDragStart(event, page) {
  draggedPage.value = page;
  event.dataTransfer.effectAllowed = 'move';
}

async function handleDrop(event, targetPage) {
  if (!draggedPage.value || draggedPage.value.id === targetPage.id) {
    return;
  }
  
  const draggedIndex = pages.value.findIndex(p => p.id === draggedPage.value.id);
  const targetIndex = pages.value.findIndex(p => p.id === targetPage.id);
  
  // Reorder locally
  const newPages = [...pages.value];
  const [removed] = newPages.splice(draggedIndex, 1);
  newPages.splice(targetIndex, 0, removed);
  
  // Update sort orders
  const updates = newPages.map((page, index) => ({
    id: page.id,
    sort_order: index
  }));
  
  try {
    const pageIds = updates.map(u => u.id);
    await reorderPages(pageIds);
    
    pages.value = newPages;
  } catch (error) {
    console.error('Failed to reorder pages:', error);
  }
  
  draggedPage.value = null;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;
  
  // Get user's locale and timezone
  const userLocale = navigator.language || 'en-US';
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Use Intl.DateTimeFormat to properly handle timezone
  const formatter = new Intl.DateTimeFormat(userLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: userTimezone // Use user's local timezone
  });
  
  return formatter.format(date);
}

function closeGroupDialog() {
  showGroupDialog.value = false;
  editingGroup.value = null;
  groupForm.value = {
    name: '',
    description: '',
    color: '#3b82f6'
  };
}

function cancelEditGroup() {
  editingGroup.value = null;
  groupForm.value = {
    name: '',
    description: '',
    color: '#3b82f6'
  };
}

function closePageDialog() {
  showPageDialog.value = false;
  editingPage.value = null;
  pageForm.value = {
    title: '',
    filename: '',
    group_id: null
  };
}

function selectGroup(groupId) {
  if (filterGroupId.value === groupId) {
    filterGroupId.value = null;
  } else {
    filterGroupId.value = groupId;
  }
  loadPages();
}

function toggleGroupDropdown() {
  isGroupDropdownOpen.value = !isGroupDropdownOpen.value;
}

function selectGroupFromDropdown(groupId) {
  filterGroupId.value = groupId;
  isGroupDropdownOpen.value = false;
  loadPages();
}

function openGroupManager() {
  isGroupDropdownOpen.value = false;
  showGroupDialog.value = true;
}

function clearGroupFilter() {
  filterGroupId.value = null;
  loadPages();
}

function getGroupName(groupId) {
  const group = groups.value.find(g => g.id === groupId);
  return group ? group.name : '';
}

// Generate preview image from HTML content
const generatePreviewFromHtml = async (htmlContent) => {
  try {
    // Create a temporary iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Write HTML content to iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;

    // Capture the iframe content
    const canvas = await html2canvas(iframe.contentDocument.body, {
      backgroundColor: '#ffffff',
      scale: 0.3, // Lower scale for smaller preview
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: 1200,
      height: 800
    });

    // Remove iframe
    document.body.removeChild(iframe);

    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    return dataUrl;
  } catch (error) {
    console.error('Error generating preview from HTML:', error);
    return null;
  }
};

// Generate thumbnails for pages without preview images
const generateThumbnailsForPages = async (pageIds) => {
  let successCount = 0;
  let errorCount = 0;

  for (const pageId of pageIds) {
    try {
      const page = pages.value.find(p => p.id === pageId);
      if (!page || !page.html_content) continue;

      // Generate preview image
      const previewImage = await generatePreviewFromHtml(page.html_content);
      
      if (previewImage) {
        // Update page with preview image
        const result = await updatePage(pageId, {
          title: page.title,
          filename: page.filename,
          html_content: page.html_content,
          sections_data: page.sections_data,
          group_id: page.group_id,
          sort_order: page.sort_order,
          preview_image: previewImage
        });

        if (result.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageId}:`, error);
      errorCount++;
    }
  }

  return { successCount, errorCount };
};

// Generate thumbnail for a single page
const generateSingleThumbnail = async (pageId) => {
  try {
    const { successCount, errorCount } = await generateThumbnailsForPages([pageId]);
    
    if (successCount > 0) {
      await loadPages();
      await dialog.success('Preview image has been created successfully.', {
        title: 'Thumbnail Generated!',
        icon: '🖼️'
      });
    } else {
      await dialog.error('Please check the console for more details.', {
        title: 'Failed to Generate Thumbnail'
      });
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    await dialog.error(error.message || 'An unexpected error occurred.', {
      title: 'Failed to Generate Thumbnail'
    });
  }
};

// Generate thumbnails for all pages that don't have one
const generateAllThumbnails = async () => {
  if (isGeneratingThumbnails.value) {
    return; // Prevent multiple simultaneous generations
  }

  // Find all pages without thumbnails
  const pagesNeedingThumbnails = pages.value
    .filter(p => !p.preview_image && p.html_content)
    .map(p => p.id);

  if (pagesNeedingThumbnails.length === 0) {
    await dialog.success('All your pages already have thumbnails.', {
      title: 'All Set!',
      icon: '✅'
    });
    return;
  }

  // Show loading message
  isGeneratingThumbnails.value = true;
  const confirmGenerate = await dialog.confirm(
    `Found ${pagesNeedingThumbnails.length} page(s) without thumbnails.\n\nGenerating all thumbnails may take up to 30 seconds.\nPlease be patient and do not close this window.\n\nContinue?`,
    {
      title: 'Generate Thumbnails',
      icon: '🖼️',
      confirmText: 'Generate',
      cancelText: 'Cancel'
    }
  );

  if (!confirmGenerate) {
    isGeneratingThumbnails.value = false;
    return;
  }

  try {
    // Generate thumbnails
    const { successCount, errorCount } = await generateThumbnailsForPages(pagesNeedingThumbnails);
    
    // Refresh pages to show new thumbnails
    await loadPages();
    
    // Show result
    await dialog.success(`Successfully generated: ${successCount}\nFailed: ${errorCount}`, {
      title: 'Thumbnail Generation Complete!',
      icon: '🎉'
    });
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    await dialog.error('Please check the console for more details.', {
      title: 'Failed to Generate Thumbnails'
    });
  } finally {
    isGeneratingThumbnails.value = false;
  }
};

// Pull All function moved to PullAllButton component

function closeManager() {
  emit('close');
}


// Listen for page update events from editor
function handlePageUpdated() {
  // Refresh pages to update sync status
  loadPages();
}

onMounted(() => {
  checkGitHubStatus();
  loadGroups();
  loadPages();
  
  // Listen for page update events
  window.addEventListener('page-updated', handlePageUpdated);
});

onBeforeUnmount(() => {
  // Clean up event listener
  window.removeEventListener('page-updated', handlePageUpdated);
});
</script>

<style scoped>
.storage-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.manager-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.close-btn {
  background: #ef4444;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #dc2626;
}

.github-status {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  display: flex;
  align-items: center;
  gap: 8px;
}

.github-status.connected {
  background: #d1fae5;
  border-color: #10b981;
}

.status-icon {
  font-size: 18px;
}

.github-info {
  color: #6b7280;
  font-size: 14px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.group-filter {
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-pull {
  background: #d4e8f1;
  border: 1px solid #b8d0e8;
  color: #1e3a5e;
}

.btn-pull:hover:not(:disabled) {
  background: #c0d8e8;
}

.btn-pull:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.groups-section {
  margin-bottom: 32px;
}

.groups-section h3 {
  margin-bottom: 16px;
  color: #1f2937;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.group-card {
  border: 2px solid;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-card.active {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
  border-width: 3px;
}

.group-card.active::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  background: #10b981;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.group-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-header h4 {
  margin: 0;
  font-size: 16px;
}

.group-actions {
  display: flex;
  gap: 4px;
}

.group-body {
  padding: 12px 16px;
}

.group-body p {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.page-count {
  font-size: 12px;
  color: #9ca3af;
}

.group-filter-status {
  margin-top: 16px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.group-filter-status span {
  color: #1e40af;
  font-size: 14px;
}

.group-filter-status strong {
  font-weight: 600;
}

.btn-clear-filter {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-clear-filter:hover {
  background: #2563eb;
}

.pages-section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.filter-dropdown {
  position: relative;
  min-width: 220px;
}

/* Smart Sync Button */
.btn-smart-sync {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
}

.btn-smart-sync:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.btn-smart-sync:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-smart-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-smart-sync.syncing {
  animation: pulse 1.5s ease-in-out infinite;
}

.btn-smart-sync .sync-icon {
  font-size: 20px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* Dropdown Trigger */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  gap: 12px;
}

.dropdown-trigger:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.dropdown-trigger.open {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.selected-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.filter-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.group-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.all-text {
  color: #64748b;
}

.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.dropdown-arrow {
  font-size: 10px;
  color: #64748b;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-trigger.open .dropdown-arrow {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
}

.dropdown-item.active {
  background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%);
  font-weight: 600;
}

.dropdown-item.active::before {
  content: '✓';
  position: absolute;
  left: -8px;
  font-size: 14px;
  color: #3b82f6;
  font-weight: bold;
}

.item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-size: 14px;
  color: #334155;
}

.dropdown-item.active .item-text {
  color: #1e40af;
}

.item-count {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.dropdown-item.active .item-count {
  background: #3b82f6;
  color: white;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
  margin: 4px 0;
}

.manage-item {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 500;
  border-top: 2px solid #e2e8f0;
}

.manage-item:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
}

.manage-item .item-text {
  color: #3b82f6;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.dropdown-enter-from {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

.view-options {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-generate-thumbnails {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
}

.btn-generate-thumbnails:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-generate-thumbnails:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-generate-thumbnails.loading {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.icon-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
}

.icon-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.icon-btn.delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 16px;
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.page-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  cursor: move;
  transition: all 0.2s;
}

.page-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.page-preview {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-preview.placeholder span {
  font-size: 48px;
  opacity: 0.3;
}

.page-info {
  padding: 16px;
}

.page-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1f2937;
}

.page-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.group-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.date {
  font-size: 12px;
  color: #9ca3af;
}

.page-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-row {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: move;
  transition: all 0.2s;
}

.page-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-row-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.drag-handle {
  color: #9ca3af;
  cursor: grab;
  font-size: 18px;
}

.page-main {
  flex: 1;
}

.page-main h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #1f2937;
}

.filename {
  font-size: 13px;
  color: #6b7280;
}

/* ===== Modal Base Styles ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(30px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 2px solid #f3f4f6;
  background: white;
  gap: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.modal-subtitle {
  margin: 6px 0 0 0;
  font-size: 14px;
  font-weight: normal;
  color: #6b7280;
  line-height: 1.5;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.header-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 2px solid #f3f4f6;
  background: #fafafa;
}

.modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.modal-btn-cancel {
  background: white;
  border: 2px solid #e5e7eb;
  color: #374151;
}

.modal-btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.modal-btn-confirm:active:not(:disabled) {
  transform: translateY(0);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #9ca3af !important;
  box-shadow: none !important;
}

/* Legacy support */
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
}

.group-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.group-manager-header h3 {
  margin: 0;
}

.github-sync-buttons {
  display: flex;
  gap: 8px;
}

.btn-sync {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
}

.btn-sync:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input[type="color"] {
  height: 40px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* Edit Content Section */
.edit-content-section {
  margin: 24px 0;
  padding: 20px;
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  text-align: center;
}

.btn-edit-content {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 300px;
}

.btn-edit-content:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.help-text {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

/* Group Manager Modal Styles */
.group-manager-modal {
  max-width: 700px;
  max-height: 85vh;
}

.group-form-section {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 24px;
}

.group-form-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1f2937;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row .form-group {
  margin-bottom: 0;
}

.form-row .form-group:last-child {
  width: 100px;
}

.groups-list-section {
  margin-top: 24px;
}

.groups-list-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #1f2937;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.group-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.group-item.editing {
  background: #eff6ff;
  border-color: #3b82f6;
}

.group-color-bar {
  width: 4px;
  height: 48px;
  border-radius: 2px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-info strong {
  font-size: 14px;
  color: #1f2937;
}

.group-desc {
  font-size: 13px;
  color: #6b7280;
}

.group-count {
  font-size: 12px;
  color: #9ca3af;
}

.group-item-actions {
  display: flex;
  gap: 4px;
}

.modal-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

</style>

