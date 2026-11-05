<template>
  <div class="studio" v-if="drama">
    <header class="studio-topbar">
      <div class="studio-topbar-main">
        <button class="back-btn topbar-back" @click="navigateTo(`/drama/${dramaId}`)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ $t('episode.header.backToProject') }}
        </button>
        <KpiHomeLink compact />
        <div class="studio-identity">
          <h1 class="studio-title">{{ drama.title }}</h1>
          <span class="studio-episode-chip">{{ $t('episode.header.episodeChip', { n: episodeNumber }) }}</span>
          <div class="studio-meta-row">
            <span class="studio-meta-pill">{{ currentSubStageLabel }}</span>
            <span class="studio-meta-pill is-progress">{{ pipelineProgress }}/8</span>
            <span class="studio-meta-inline">{{ $t('episode.header.metaInline', { chars: chars.length, shots: sbs.length }) }}</span>
          </div>
        </div>
      </div>

      <div class="studio-topbar-side">
        <CreditsBar compact />
        <div class="studio-actions">
          <button class="btn" @click="refresh">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {{ $t('episode.header.refresh') }}
          </button>
          <button class="btn btn-primary" @click="panel = mergeUrl ? 'export' : (sbs.length ? 'production' : 'script')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {{ mergeUrl ? $t('episode.header.viewFilm') : (sbs.length ? $t('episode.header.continueProduction') : $t('episode.header.startProduction')) }}
          </button>
        </div>
      </div>
    </header>

    <div class="studio-body">
    <!-- ========== LEFT SIDEBAR ========== -->
    <aside class="sidebar">
      <nav class="pipeline" :aria-label="$t('episode.sidebar.pipelineAria')">
        <div
          v-for="section in sidebarSections"
          :key="section.id"
          class="pipe-section"
        >
          <div class="pipe-section-label">{{ section.label }}</div>
          <button
            v-for="item in section.items"
            :key="item.key"
            :class="['pipe-item pipe-item-sub', { active: activeSubStepKey === item.key, done: item.done }]"
            :aria-current="activeSubStepKey === item.key ? 'step' : undefined"
            @click="goSubStep(item.key)"
          >
            <span class="pipe-icon" :class="item.done ? 'icon-done' : activeSubStepKey === item.key ? 'icon-active' : ''">
              <svg v-if="item.done" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <component v-else :is="item.icon" :size="11" />
            </span>
            <span class="pipe-copy">
              <span class="pipe-label">{{ item.label }}</span>
              <span v-if="item.desc" class="pipe-sub">{{ item.desc }}</span>
            </span>
          </button>
        </div>
      </nav>

      <!-- Bottom: Progress + Refresh -->
      <div class="sidebar-bottom">
        <div class="progress-wrap">
          <div class="progress-head">
            <span id="studio-progress-label" class="progress-label">{{ $t('episode.sidebar.progressLabel') }}</span>
            <span class="progress-val">{{ pipelineProgress }}/8</span>
          </div>
          <div class="progress-track" role="progressbar" aria-labelledby="studio-progress-label" :aria-valuenow="pipelineProgress" :aria-valuemin="0" :aria-valuemax="8">
            <div class="progress-fill" :style="{ width: (pipelineProgress / 8 * 100) + '%' }"></div>
          </div>
        </div>
        <div class="sidebar-jumper" v-if="sidebarJumpSteps.length">
          <button
            v-for="step in sidebarJumpSteps"
            :key="step.key"
            :class="['sidebar-jump-dot', { active: activeSubStepKey === step.key, done: step.done }]"
            @click="goSubStep(step.key)"
            :title="step.label"
            :aria-label="step.label"
            :aria-current="activeSubStepKey === step.key ? 'step' : undefined"
          ></button>
        </div>
        <button class="refresh-btn" @click="refresh">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          {{ $t('episode.sidebar.refreshData') }}
        </button>
      </div>
    </aside>

    <!-- ========== MAIN CONTENT ========== -->
    <main class="main">
      <div v-if="activeSubSteps.length" class="stage-subnav">
        <button
          v-for="sub in activeSubSteps"
          :key="sub.key"
          :class="['stage-subnav-item', { active: activeSubStepKey === sub.key, done: sub.done }]"
          :aria-current="activeSubStepKey === sub.key ? 'step' : undefined"
          @click="goSubStep(sub.key)"
        >
          <span>{{ sub.label }}</span>
          <span v-if="sub.done" class="stage-subnav-dot"></span>
        </button>
      </div>

      <!-- ===== SCRIPT PANEL ===== -->
      <div v-if="panel === 'script'" class="content-panel">
        <!-- Step 0: Raw Content -->
        <div v-if="scriptStep === 0" class="step-editor">
          <div class="step-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <span class="step-num">01</span>
                <span class="step-name">{{ $t('episode.script.stepRaw') }}</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span v-if="rawLen" class="char-count">{{ $t('episode.script.charCount', { n: rawLen }) }}</span>
              <button class="btn btn-sm" @click="saveRaw(); toast.success($t('episode.script.saved'))">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {{ $t('episode.script.save') }}
              </button>
            </div>
          </div>
          <textarea
            class="fill-textarea"
            v-model="localRaw"
            :aria-label="$t('episode.script.rawAria')"
            :placeholder="$t('episode.script.rawPlaceholder')"
          />
        </div>

        <!-- Step 1: Rewrite -->
        <div v-else-if="scriptStep === 1" class="step-editor">
          <div class="step-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <span class="step-num">02</span>
                <span class="step-name">{{ $t('episode.script.stepRewrite') }}</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span v-if="scriptLen" class="char-count">{{ $t('episode.script.charCount', { n: scriptLen }) }}</span>
              <button v-if="rawContent" class="btn btn-sm" @click="skipRewrite">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/><path d="M13 18l6-6-6-6"/></svg>
                {{ $t('episode.script.skipRewrite') }}
              </button>
              <button v-if="scriptContent" class="btn btn-sm" @click="doRewrite" :disabled="rn">
                <Loader2 v-if="rn && rt === 'script_rewriter'" :size="11" class="animate-spin" />
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {{ $t('episode.script.rewriteAgain') }}
                <span class="btn-credit">{{ creditTag(agentCost) }}</span>
              </button>
            </div>
          </div>

          <div v-if="!scriptContent && !rn" class="step-empty">
            <div class="empty-visual">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <div class="empty-title">{{ $t('episode.script.rewriteTitle') }}</div>
            <div class="empty-desc">{{ $t('episode.script.rewriteDesc') }}</div>
            <div class="step-empty-actions">
              <button class="btn btn-primary" @click="doRewrite">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {{ $t('episode.script.startRewrite') }}
                <span class="btn-credit">{{ creditTag(agentCost) }}</span>
              </button>
              <button class="btn" @click="skipRewrite">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/><path d="M13 18l6-6-6-6"/></svg>
                {{ $t('episode.script.skipRewrite') }}
              </button>
            </div>
          </div>
          <div v-else-if="rn && rt === 'script_rewriter'" class="step-loading" role="status" aria-live="polite">
            <Loader2 :size="24" class="animate-spin" style="color:var(--cyan)" />
            <div class="loading-text">{{ $t('episode.script.rewriting') }}</div>
          </div>
          <textarea v-else class="fill-textarea" v-model="localScript" :aria-label="$t('episode.script.scriptAria')" :placeholder="$t('episode.script.scriptPlaceholder')" />
        </div>

        <!-- Step 2: Extract -->
        <div v-else-if="scriptStep === 2" class="step-editor">
          <div class="step-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <span class="step-num">03</span>
                <span class="step-name">{{ $t('episode.extract.stepName') }}</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span v-if="chars.length" class="char-count">{{ $t('episode.extract.charSceneCount', { chars: chars.length, scenes: scenes.length }) }}</span>
              <button v-if="chars.length" class="btn btn-sm" @click="doExtract" :disabled="rn">
                <Loader2 v-if="rn && rt === 'extractor'" :size="11" class="animate-spin" />
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {{ $t('episode.extract.reExtract') }}
                <span class="btn-credit">{{ creditTag(agentCost) }}</span>
              </button>
            </div>
          </div>

          <div v-if="!chars.length && !rn" class="step-empty">
            <div class="empty-visual">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div class="empty-title">{{ $t('episode.extract.extractTitle') }}</div>
            <div class="empty-desc">{{ $t('episode.extract.extractDesc') }}</div>
            <button class="btn btn-primary" @click="doExtract">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {{ $t('episode.extract.startExtract') }}
              <span class="btn-credit">{{ creditTag(agentCost) }}</span>
            </button>
          </div>
          <div v-else-if="rn && rt === 'extractor'" class="step-loading" role="status" aria-live="polite">
            <Loader2 :size="24" class="animate-spin" style="color:var(--cyan)" />
            <div class="loading-text">{{ $t('episode.extract.extracting') }}</div>
          </div>
          <div v-else class="extract-stage">
            <aside class="card extract-summary">
              <div class="extract-summary-kicker">Extraction Board</div>
              <div class="extract-summary-title">{{ $t('episode.extract.resultTitle') }}</div>
              <div class="extract-summary-desc">{{ $t('episode.extract.resultDesc') }}</div>
              <div class="extract-summary-stats">
                <div class="extract-summary-stat">
                  <span>{{ $t('episode.extract.charLabel') }}</span>
                  <strong>{{ chars.length }}</strong>
                </div>
                <div class="extract-summary-stat">
                  <span>{{ $t('episode.extract.sceneLabel') }}</span>
                  <strong>{{ scenes.length }}</strong>
                </div>
              </div>
              <div class="extract-summary-note">{{ $t('episode.extract.resultNote') }}</div>
            </aside>

            <div class="card extract-card">
              <div class="extract-card-head">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{{ $t('episode.extract.charLabel') }}</span>
                <span class="tag tag-accent">{{ chars.length }}</span>
              </div>
              <div class="extract-list">
                <div v-for="c in chars" :key="c.id" class="extract-row">
                  <div class="char-avatar">{{ c.name?.[0] || '?' }}</div>
                  <div class="extract-info">
                    <div class="extract-name-row">
                      <div class="extract-name">{{ c.name }}</div>
                      <span class="tag">{{ c.role || $t('episode.extract.defaultRole') }}</span>
                    </div>
                    <div class="extract-meta wrap">{{ c.description || c.appearance || c.personality || $t('episode.extract.noDesc') }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card extract-card" v-if="scenes.length">
              <div class="extract-card-head">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{{ $t('episode.extract.sceneLabel') }}</span>
                <span class="tag tag-accent">{{ scenes.length }}</span>
              </div>
              <div class="extract-list">
                <div v-for="s in scenes" :key="s.id" class="extract-row">
                  <div class="scene-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div class="extract-info">
                    <div class="extract-name-row">
                      <div class="extract-name">{{ s.location }}</div>
                      <span v-if="s.time" class="tag">{{ s.time }}</span>
                    </div>
                    <div class="extract-meta wrap">{{ s.description || s.time || $t('episode.extract.sceneNoDesc') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Voice Assignment -->
        <div v-else-if="scriptStep === 3" class="step-editor">
          <div class="step-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <span class="step-num">04</span>
                <span class="step-name">{{ $t('episode.voice.stepName') }}</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span v-if="charsVoiced" class="char-count">{{ $t('episode.voice.assignedCount', { n: charsVoiced, total: chars.length }) }}</span>
              <span v-if="voiceSampleCount" class="char-count">{{ $t('episode.voice.sampleCount', { n: voiceSampleCount, total: charsVoiced }) }}</span>
              <button v-if="charsVoiced" class="btn btn-sm" @click="doVoice" :disabled="rn">
                <Loader2 v-if="rn && rt === 'voice_assigner'" :size="11" class="animate-spin" />
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                {{ $t('episode.voice.reAssign') }}
                <span class="btn-credit">{{ creditTag(agentCost) }}</span>
              </button>
              <button v-if="charsVoiced" class="btn btn-sm" @click="batchGenSamples">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19 5v14"/></svg>
                {{ $t('episode.voice.genSamples') }}
                <span class="btn-credit is-free">{{ freeTag() }}</span>
              </button>
            </div>
          </div>

          <div v-if="!charsVoiced && !rn" class="step-empty">
            <div class="empty-visual">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            </div>
            <div class="empty-title">{{ $t('episode.voice.emptyTitle') }}</div>
            <div class="empty-desc">{{ $t('episode.voice.emptyDesc') }}</div>
            <button class="btn btn-primary" @click="doVoice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {{ $t('episode.voice.autoAssign') }}
              <span class="btn-credit">{{ creditTag(agentCost) }}</span>
            </button>
          </div>
          <div v-else-if="rn && rt === 'voice_assigner'" class="step-loading" role="status" aria-live="polite">
            <Loader2 :size="24" class="animate-spin" style="color:var(--cyan)" />
            <div class="loading-text">{{ $t('episode.voice.assigning') }}</div>
          </div>
          <div v-else class="voice-stage">
            <aside class="card voice-stage-panel">
              <div class="voice-stage-kicker">Voice Casting</div>
              <div class="voice-stage-title">{{ $t('episode.voice.stageTitle') }}</div>
              <div class="voice-stage-desc">{{ $t('episode.voice.stageDesc') }}</div>
              <div class="voice-stage-stats">
                <div class="voice-stage-stat">
                  <span class="voice-stage-stat-label">{{ $t('episode.voice.assigned') }}</span>
                  <strong>{{ charsVoiced }}/{{ chars.length }}</strong>
                </div>
                <div class="voice-stage-stat">
                  <span class="voice-stage-stat-label">{{ $t('episode.voice.samples') }}</span>
                  <strong>{{ voiceSampleCount }}/{{ charsVoiced }}</strong>
                </div>
              </div>
              <div class="voice-library-meta">
                <span>{{ $t('episode.voice.library') }}</span>
                <span>{{ $t('episode.voice.libraryCount', { n: voiceProfiles.length }) }}</span>
              </div>
              <div class="voice-library">
                <div v-for="voice in voiceProfiles" :key="voice.id" class="voice-library-item">
                  <div class="voice-library-head">
                    <span class="voice-library-name">{{ voice.label }}</span>
                    <span class="tag">{{ voice.gender }}</span>
                  </div>
                  <div class="voice-library-traits">{{ voice.traits }}</div>
                  <div class="voice-library-fit">{{ voice.suitable }}</div>
                </div>
              </div>
            </aside>

            <div class="voice-grid">
              <div v-for="c in chars" :key="c.id" class="card voice-card">
                <div class="voice-card-head">
                  <div class="voice-char">
                    <div class="char-avatar lg">{{ c.name?.[0] || '?' }}</div>
                    <div class="voice-name">
                      <div class="voice-name-row">
                        <div class="extract-name">{{ c.name }}</div>
                        <span class="tag" :class="(c.voice_style || c.voiceStyle) ? 'tag-success' : ''">{{ (c.voice_style || c.voiceStyle) ? $t('episode.voice.tagAssigned') : $t('episode.voice.tagUnassigned') }}</span>
                      </div>
                      <div class="extract-meta">{{ c.role || $t('episode.extract.defaultRole') }}</div>
                    </div>
                  </div>
                </div>

                <div class="voice-card-copy">
                  <div class="voice-card-text">{{ c.description || c.personality || c.appearance || $t('episode.voice.noCharDesc') }}</div>
                </div>

                <div class="voice-select-block">
                  <span class="voice-block-label">{{ $t('episode.voice.selectVoice') }}</span>
                  <BaseSelect
                    :model-value="c.voice_style || c.voiceStyle || ''"
                    :options="voiceSelectOptions"
                    :placeholder="$t('episode.voice.selectVoice')"
                    searchable
                    style="width:100%"
                    @update:model-value="updateCharVoice(c.id, $event)"
                  />
                </div>

                <div v-if="getVoiceProfile(c.voice_style || c.voiceStyle)" class="voice-profile-card">
                  <div class="voice-profile-head">
                    <span class="voice-profile-name">{{ getVoiceProfile(c.voice_style || c.voiceStyle)?.label }}</span>
                    <span class="tag">{{ getVoiceProfile(c.voice_style || c.voiceStyle)?.gender }}</span>
                  </div>
                  <div class="voice-profile-traits">{{ getVoiceProfile(c.voice_style || c.voiceStyle)?.traits }}</div>
                  <div class="voice-profile-fit">{{ getVoiceProfile(c.voice_style || c.voiceStyle)?.suitable }}</div>
                </div>

                <div class="voice-actions-row">
                  <button class="btn btn-sm" :disabled="!(c.voice_style || c.voiceStyle)" @click="genSample(c.id)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    {{ (c.voice_sample_url || c.voiceSampleUrl) ? $t('episode.voice.regenSample') : $t('episode.voice.genSample') }}
                    <span class="btn-credit is-free">{{ freeTag() }}</span>
                  </button>
                  <span class="dim" style="font-size:11px">{{ (c.voice_sample_url || c.voiceSampleUrl) ? $t('episode.voice.sampleReady') : $t('episode.voice.sampleHint') }}</span>
                </div>

                <div v-if="c.voice_sample_url || c.voiceSampleUrl" class="voice-player">
                  <audio :src="staticUrl(c.voice_sample_url || c.voiceSampleUrl)" controls preload="none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Storyboard -->
        <div v-else-if="scriptStep === 4" class="step-editor">
          <div class="step-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <span class="step-num">05</span>
                <span class="step-name">{{ $t('episode.storyboard.stepName') }}</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span v-if="sbs.length" class="char-count">{{ $t('episode.storyboard.shotDurationCount', { n: sbs.length, d: totalDuration }) }}</span>
              <button v-if="sbs.length" class="btn btn-sm" @click="addShot">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {{ $t('episode.storyboard.add') }}
              </button>
              <template v-if="!sbs.length">
                <span class="locked-config">{{ $t('episode.storyboard.videoConfigPrefix', { config: lockedVideoConfigLabel }) }}</span>
              </template>
              <button class="btn btn-sm" :disabled="rn" @click="doBreakdown">
                <Loader2 v-if="rt === 'storyboard_breaker'" :size="11" class="animate-spin" />
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {{ sbs.length ? $t('episode.storyboard.rebreak') : $t('episode.storyboard.aiBreak') }}
                <span class="btn-credit">{{ creditTag(agentCost) }}</span>
              </button>
            </div>
          </div>

          <div v-if="sbs.length" class="split-layout">
            <!-- Shot List -->
            <div class="shot-list">
              <div class="shot-list-head">
                <div>
                  <div class="shot-list-title">{{ $t('episode.storyboard.listTitle') }}</div>
                  <div class="shot-list-sub">{{ $t('episode.storyboard.listSub') }}</div>
                </div>
                <span class="tag mono">{{ totalDuration }}s</span>
              </div>
              <div class="shot-list-body">
                <div
                  v-for="(sb, i) in sbs"
                  :key="sb.id"
                  :class="['shot-item', { active: selectedSb?.id === sb.id }]"
                  @click="selectedSb = sb"
                >
                  <div class="shot-item-header">
                    <div class="shot-num">#{{ String(i+1).padStart(2,'0') }}</div>
                    <span class="tag" style="font-size:10px">{{ shotTypeOf(sb) || '—' }}</span>
                    <span v-if="getStoryboardCharacterIds(sb).length" class="tag" style="font-size:10px">{{ $t('episode.storyboard.charCountTag', { n: getStoryboardCharacterIds(sb).length }) }}</span>
                    <div class="shot-status">
                      <div v-if="sb.imageUrl || sb.composedImage || sb.firstFrameImage" class="shot-dot has-img" :title="$t('episode.storyboard.imgGeneratedTitle')"></div>
                      <div v-if="sb.videoUrl || sb.composedVideoUrl" class="shot-dot has-video" :title="$t('episode.storyboard.vidGeneratedTitle')"></div>
                      <div v-if="sb.dialogue" class="shot-dot has-dialogue" :title="$t('episode.storyboard.hasDialogueTitle')"></div>
                    </div>
                  </div>
                  <div class="shot-body">
                    <div class="shot-desc">{{ sb.description || sb.title || $t('episode.storyboard.noDesc') }}</div>
                  </div>
                  <div class="shot-meta">
                    <span class="mono dim" style="font-size:10px">{{ sb.duration || 10 }}s</span>
                    <span v-if="sb.location" class="shot-location">{{ sb.location }}</span>
                    <span v-if="getStoryboardCharacterNames(sb).length" class="shot-location">{{ getStoryboardCharacterNames(sb).join(' / ') }}</span>
                    <span v-if="sb.dialogue" class="shot-dialogue">{{ sb.dialogue }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Detail Panel -->
            <div class="detail-panel" v-if="selectedSb">
                <div class="detail-head">
                  <div class="detail-head-copy">
                    <span class="detail-head-title">{{ $t('episode.storyboard.shotNo', { n: sbs.indexOf(selectedSb) + 1 }) }}</span>
                  <span class="detail-head-sub">{{ selectedSb.title || $t('episode.storyboard.shotN', { n: sbs.indexOf(selectedSb) + 1 }) }} · {{ shotTypeOf(selectedSb) || $t('episode.storyboard.noShotType') }}</span>
                  </div>
                  <span class="tag mono">{{ (selectedSb.duration || 10) }}s</span>
                  <button class="btn btn-ghost btn-icon ml-auto" style="color:var(--error)" :aria-label="$t('episode.storyboard.deleteShotAria')" @click="deleteShot(selectedSb)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
              </div>
              <div class="detail-body">
                <div class="detail-hero">
                  <div class="detail-hero-copy">
                    <div class="detail-hero-label">{{ $t('episode.storyboard.overview') }}</div>
                    <div class="detail-hero-text">{{ selectedSb.description || selectedSb.title || $t('episode.storyboard.noDescHint') }}</div>
                    <div class="detail-status-row">
                      <span class="tag">{{ getSceneName(selectedSb) }}</span>
                      <span class="tag">{{ shotAngleOf(selectedSb) || $t('episode.storyboard.noAngle') }}</span>
                      <span class="tag">{{ shotMovementOf(selectedSb) || $t('episode.storyboard.noMovement') }}</span>
                      <span class="tag" :class="getFirstFrame(selectedSb) ? 'tag-success' : ''">{{ $t('episode.storyboard.firstFrame') }} {{ getFirstFrame(selectedSb) ? $t('episode.status.generated') : $t('episode.status.pending') }}</span>
                      <span class="tag" :class="getLastFrame(selectedSb) ? 'tag-success' : ''">{{ $t('episode.storyboard.lastFrame') }} {{ getLastFrame(selectedSb) ? $t('episode.status.generated') : $t('episode.status.pending') }}</span>
                      <span class="tag" :class="hasVid(selectedSb) ? 'tag-success' : ''">{{ $t('episode.videos.video') }} {{ hasVid(selectedSb) ? $t('episode.status.generated') : $t('episode.status.pending') }}</span>
                    </div>
                  </div>
                  <div class="detail-preview-grid">
                    <div class="detail-preview-card">
                      <div class="detail-preview-title">{{ $t('episode.storyboard.firstFrame') }}</div>
                      <div class="detail-preview-media">
                        <img
                          v-if="getFirstFrame(selectedSb)"
                          :src="staticUrl(getFirstFrame(selectedSb))"
                          class="previewable-image"
                          @click.stop="openImageViewer(staticUrl(getFirstFrame(selectedSb)), $t('episode.storyboard.firstFrameViewer', { n: sbs.indexOf(selectedSb) + 1 }))"
                        />
                        <div v-else class="detail-preview-empty">
                          <button
                            v-if="!isPendingShotFrame(selectedSb.id, 'first_frame')"
                            class="btn btn-sm"
                            @click.stop="genShotFrame(selectedSb, 'first_frame')"
                          >
                            {{ $t('episode.storyboard.genFirstFrame') }}
                            <span class="btn-credit">{{ creditTag(imageCost) }}</span>
                          </button>
                          <span v-else>{{ $t('episode.status.generatingEllipsis') }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="detail-preview-card">
                      <div class="detail-preview-title">{{ $t('episode.storyboard.lastFrame') }}</div>
                      <div class="detail-preview-media">
                        <img
                          v-if="getLastFrame(selectedSb)"
                          :src="staticUrl(getLastFrame(selectedSb))"
                          class="previewable-image"
                          @click.stop="openImageViewer(staticUrl(getLastFrame(selectedSb)), $t('episode.storyboard.lastFrameViewer', { n: sbs.indexOf(selectedSb) + 1 }))"
                        />
                        <div v-else class="detail-preview-empty">
                          <button
                            v-if="!isPendingShotFrame(selectedSb.id, 'last_frame')"
                            class="btn btn-sm"
                            @click.stop="genShotFrame(selectedSb, 'last_frame')"
                          >
                            {{ $t('episode.storyboard.genLastFrame') }}
                            <span class="btn-credit">{{ creditTag(imageCost) }}</span>
                          </button>
                          <span v-else>{{ $t('episode.status.generatingEllipsis') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <div class="detail-section-head">
                    <span class="detail-section-title">{{ $t('episode.storyboard.structTitle') }}</span>
                    <span class="detail-section-copy">{{ $t('episode.storyboard.structSub') }}</span>
                  </div>
                  <div class="field-grid field-grid-4">
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelTitle') }}</span>
                      <input :value="selectedSb.title || ''" class="input"
                        @blur="updateField(selectedSb, 'title', $event.target.value)" :placeholder="$t('episode.storyboard.phTitle')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelShotType') }}</span>
                      <input
                        list="shot-type-list"
                        :value="shotTypeOf(selectedSb) || ''"
                        class="input"
                        :placeholder="$t('episode.storyboard.phShotType')"
                        @change="updateField(selectedSb, 'shot_type', $event.target.value)"
                      />
                      <datalist id="shot-type-list">
                        <option v-for="t in shotTypes" :key="t" :value="t" />
                      </datalist>
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelAngle') }}</span>
                      <input
                        list="shot-angle-list"
                        :value="selectedSb.angle || ''"
                        class="input"
                        :placeholder="$t('episode.storyboard.phAngle')"
                        @change="updateField(selectedSb, 'angle', $event.target.value)"
                      />
                      <datalist id="shot-angle-list">
                        <option v-for="t in shotAngles" :key="t" :value="t" />
                      </datalist>
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelMovement') }}</span>
                      <input
                        list="shot-movement-list"
                        :value="selectedSb.movement || ''"
                        class="input"
                        :placeholder="$t('episode.storyboard.phMovement')"
                        @change="updateField(selectedSb, 'movement', $event.target.value)"
                      />
                      <datalist id="shot-movement-list">
                        <option v-for="t in shotMovements" :key="t" :value="t" />
                      </datalist>
                    </label>
                  </div>
                  <div class="field-grid field-grid-4">
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelChars') }}</span>
                      <div class="role-pills">
                        <button
                          v-for="char in chars"
                          :key="char.id"
                          type="button"
                          :class="['role-pill', { active: isStoryboardCharacterSelected(selectedSb, char.id) }]"
                          @click="toggleStoryboardCharacter(selectedSb, char.id)"
                        >
                          {{ char.name }}
                        </button>
                        <span v-if="!chars.length" class="dim" style="font-size:12px">{{ $t('episode.storyboard.noChars') }}</span>
                      </div>
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelScene') }}</span>
                      <select class="input" :value="selectedSb.scene_id || selectedSb.sceneId || ''"
                        @change="updateField(selectedSb, 'scene_id', $event.target.value ? Number($event.target.value) : null)">
                        <option value="">{{ $t('episode.storyboard.noScene') }}</option>
                        <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
                          {{ $t('episode.storyboard.sceneTime', { location: scene.location, time: scene.time || $t('episode.storyboard.noTime') }) }}
                        </option>
                      </select>
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelLocation') }}</span>
                      <input :value="selectedSb.location || ''" class="input"
                        @blur="updateField(selectedSb, 'location', $event.target.value)" :placeholder="$t('episode.storyboard.phLocation')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelTime') }}</span>
                      <input :value="selectedSb.time || ''" class="input"
                        @blur="updateField(selectedSb, 'time', $event.target.value)" :placeholder="$t('episode.storyboard.phTime')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelDuration') }}</span>
                      <input :value="selectedSb.duration || 10" class="input" type="number" min="1" max="60"
                        @blur="updateField(selectedSb, 'duration', Number($event.target.value))" />
                    </label>
                  </div>
                </div>
                <div class="detail-section">
                  <div class="detail-section-head">
                    <span class="detail-section-title">{{ $t('episode.storyboard.semanticTitle') }}</span>
                    <span class="detail-section-copy">{{ $t('episode.storyboard.semanticSub') }}</span>
                  </div>
                  <div class="field-grid field-grid-2">
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelAction') }}</span>
                      <textarea :value="selectedSb.action || ''" class="textarea" rows="3"
                        @blur="updateField(selectedSb, 'action', $event.target.value)" :placeholder="$t('episode.storyboard.phAction')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelResult') }}</span>
                      <textarea :value="selectedSb.result || ''" class="textarea" rows="3"
                        @blur="updateField(selectedSb, 'result', $event.target.value)" :placeholder="$t('episode.storyboard.phResult')" />
                    </label>
                  </div>
                  <div class="field-grid field-grid-2">
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelDesc') }}</span>
                      <textarea :value="selectedSb.description || ''" class="textarea" rows="4"
                        @blur="updateField(selectedSb, 'description', $event.target.value)" :placeholder="$t('episode.storyboard.phDesc')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelAtmosphere') }}</span>
                      <textarea :value="selectedSb.atmosphere || ''" class="textarea" rows="4"
                        @blur="updateField(selectedSb, 'atmosphere', $event.target.value)" :placeholder="$t('episode.storyboard.phAtmosphere')" />
                    </label>
                  </div>
                  <label class="field">
                    <span class="field-label">{{ $t('episode.storyboard.labelDialogue') }}</span>
                    <textarea :value="selectedSb.dialogue || ''" class="textarea" rows="3"
                      @blur="updateField(selectedSb, 'dialogue', $event.target.value)" :placeholder="$t('episode.storyboard.phDialogue')" />
                  </label>
                </div>
                <div class="detail-section">
                  <div class="detail-section-head">
                    <span class="detail-section-title">{{ $t('episode.storyboard.promptTitle') }}</span>
                    <span class="detail-section-copy">{{ $t('episode.storyboard.promptSub') }}</span>
                  </div>
                  <label class="field">
                    <span class="field-label">{{ $t('episode.storyboard.labelImagePrompt') }}</span>
                    <textarea :value="selectedSb.image_prompt || selectedSb.imagePrompt || ''" class="textarea" rows="4"
                      @blur="updateField(selectedSb, 'image_prompt', $event.target.value)" :placeholder="$t('episode.storyboard.phImagePrompt')" />
                  </label>
                  <label class="field">
                    <span class="field-label">{{ $t('episode.storyboard.labelVideoPrompt') }}</span>
                    <textarea :value="selectedSb.video_prompt || selectedSb.videoPrompt || ''" class="textarea" rows="5"
                      @blur="updateField(selectedSb, 'video_prompt', $event.target.value)" :placeholder="$t('episode.storyboard.phVideoPrompt')" />
                  </label>
                  <div class="field-grid field-grid-2">
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelBgmPrompt') }}</span>
                      <textarea :value="selectedSb.bgm_prompt || selectedSb.bgmPrompt || ''" class="textarea" rows="3"
                        @blur="updateField(selectedSb, 'bgm_prompt', $event.target.value)" :placeholder="$t('episode.storyboard.phBgm')" />
                    </label>
                    <label class="field">
                      <span class="field-label">{{ $t('episode.storyboard.labelSfxPrompt') }}</span>
                      <textarea :value="selectedSb.sound_effect || selectedSb.soundEffect || ''" class="textarea" rows="3"
                        @blur="updateField(selectedSb, 'sound_effect', $event.target.value)" :placeholder="$t('episode.storyboard.phSfx')" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="rn && rt === 'storyboard_breaker'" class="step-loading" role="status" aria-live="polite">
            <Loader2 :size="24" class="animate-spin" style="color:var(--cyan)" />
            <div class="loading-text">{{ $t('episode.storyboard.breaking') }}</div>
          </div>

          <div v-else class="step-empty">
            <div class="empty-visual">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
                <rect x="2" y="2" width="20" height="20" rx="2.5"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/>
              </svg>
            </div>
            <div class="empty-title">{{ $t('episode.storyboard.emptyTitle') }}</div>
            <div class="empty-desc">{{ $t('episode.storyboard.emptyDesc') }}</div>
            <div class="locked-config-banner">{{ $t('episode.storyboard.videoConfigCurrent', { config: lockedVideoConfigLabel }) }}</div>
            <button class="btn btn-primary" @click="doBreakdown">
              <Loader2 v-if="rt === 'storyboard_breaker'" :size="13" class="animate-spin" />
              <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {{ $t('episode.storyboard.aiBreak') }}
              <span class="btn-credit">{{ creditTag(agentCost) }}</span>
            </button>
          </div>
        </div>

      </div>

      <!-- ===== PRODUCTION PANEL ===== -->
      <div v-else-if="panel === 'production'" class="content-panel">
        <!-- Guard: need script -->
        <div v-if="!scriptContent || !sbs.length" class="step-empty" style="flex:1">
          <div class="empty-visual">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <div class="empty-title">{{ $t('episode.export.notReady') }}</div>
          <div class="empty-desc">{{ !scriptContent ? $t('episode.export.needScript') : $t('episode.export.needBreakdown') }}</div>
          <button class="btn btn-primary" @click="panel = 'script'">{{ $t('episode.export.goToScript') }}</button>
        </div>

        <template v-else>
          <div class="step-toolbar prod-toolbar">
            <div class="toolbar-left">
              <div class="step-indicator">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span class="step-name">{{ $t('episode.prod.workspace') }}</span>
              </div>
            </div>
            <div class="prod-tabs">
              <button
                v-for="t in prodTabDefs"
                :key="t.id"
                :class="['prod-tab', { active: prodTab === t.id }]"
                :aria-pressed="prodTab === t.id"
                @click="prodTab = t.id"
              >
                <component :is="t.icon" :size="11" />
                {{ t.label }}
                <span v-if="t.badge" class="prod-tab-badge">{{ t.badge }}</span>
              </button>
            </div>
          </div>

          <!-- Sub: Characters -->
          <div v-if="prodTab === 'chars'" class="prod-content">
            <div class="prod-section-bar">
              <span class="dim" style="font-size:12px">{{ $t('episode.prod.charsNeedImage', { n: visualChars.length }) }}</span>
              <span class="tag">{{ lockedImageConfigLabel }}</span>
              <span v-if="chars.length > visualChars.length" class="tag">{{ $t('episode.prod.narratorVoiceOnly') }}</span>
              <div class="ml-auto flex gap-1">
                <button class="btn btn-sm" @click="batchCharImages">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {{ $t('episode.prod.batchGenerate') }}
                  <span v-if="pendingCharImageCount" class="btn-credit">{{ creditTag(pendingCharBatchCredits) }}</span>
                </button>
              </div>
            </div>
            <div class="asset-grid">
              <div v-for="c in visualChars" :key="c.id" class="card asset-card">
                <div class="asset-cover">
                  <img
                    v-if="c.image_url || c.imageUrl"
                    :src="staticUrl(c.image_url || c.imageUrl)"
                    class="previewable-image"
                    @click.stop="openImageViewer(staticUrl(c.image_url || c.imageUrl), $t('episode.prod.imageViewer', { name: c.name }))"
                  />
                  <div v-else class="asset-cover-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span class="asset-cover-badge" :class="(c.image_url || c.imageUrl) ? 'is-ready' : (isPendingCharImage(c.id) ? 'is-pending' : '')">{{ (c.image_url || c.imageUrl) ? $t('episode.status.generated') : (isPendingCharImage(c.id) ? $t('episode.status.generating') : $t('episode.status.pending')) }}</span>
                </div>
                <div class="asset-body">
                  <div class="asset-name">{{ c.name }}</div>
                  <div class="asset-meta dim">{{ c.role || $t('episode.extract.defaultRole') }}</div>
                </div>
                <div class="asset-foot">
                  <span :class="['dot', (c.image_url || c.imageUrl) && 'ok', isPendingCharImage(c.id) && 'pending']" />
                  <span class="dim" style="font-size:10px">{{ (c.image_url || c.imageUrl) ? $t('episode.status.generated') : (isPendingCharImage(c.id) ? $t('episode.status.generating') : $t('episode.status.pending')) }}</span>
                  <button
                    class="btn btn-sm ml-auto"
                    :class="{ 'btn-ghost': !!(c.image_url || c.imageUrl) }"
                    :disabled="isPendingCharImage(c.id)"
                    :title="(c.image_url || c.imageUrl) ? $t('episode.prod.regenCharImageTitle') : $t('episode.prod.genCharImageTitle')"
                    @click="genCharImg(c.id)"
                  >
                    {{ isPendingCharImage(c.id) ? $t('episode.status.generating') : ((c.image_url || c.imageUrl) ? $t('episode.prod.regenerate') : $t('episode.prod.generate')) }}
                    <span v-if="!isPendingCharImage(c.id)" class="btn-credit">{{ creditTag(imageCost) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub: Scenes -->
          <div v-else-if="prodTab === 'scenes'" class="prod-content">
            <div class="prod-section-bar">
              <span class="dim" style="font-size:12px">{{ $t('episode.scenes.sceneCount', { n: scenes.length }) }}</span>
              <span class="tag">{{ lockedImageConfigLabel }}</span>
              <div class="ml-auto flex gap-1">
                <button class="btn btn-sm" @click="batchSceneImages">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {{ $t('episode.prod.batchGenerate') }}
                  <span v-if="pendingSceneImageCount" class="btn-credit">{{ creditTag(pendingSceneBatchCredits) }}</span>
                </button>
              </div>
            </div>
            <div class="asset-grid">
              <div v-for="s in scenes" :key="s.id" class="card asset-card">
                <div class="asset-cover wide">
                  <img
                    v-if="s.image_url || s.imageUrl"
                    :src="staticUrl(s.image_url || s.imageUrl)"
                    class="previewable-image"
                    @click.stop="openImageViewer(staticUrl(s.image_url || s.imageUrl), $t('episode.scenes.sceneImageViewer', { name: s.location }))"
                  />
                  <div v-else class="asset-cover-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <span class="asset-cover-badge" :class="(s.image_url || s.imageUrl) ? 'is-ready' : (isPendingSceneImage(s.id) || isPendingSceneUpload(s.id) ? 'is-pending' : '')">{{ (s.image_url || s.imageUrl) ? $t('episode.scenes.hasImage') : (isPendingSceneImage(s.id) ? $t('episode.status.generating') : (isPendingSceneUpload(s.id) ? $t('episode.status.uploading') : $t('episode.status.pending'))) }}</span>
                </div>
                <div class="asset-body">
                  <div class="asset-name">{{ s.location }}</div>
                  <div class="asset-meta dim">{{ s.time || '—' }}</div>
                </div>
                <div class="asset-foot">
                  <span :class="['dot', (s.image_url || s.imageUrl) && 'ok', isPendingSceneImage(s.id) && 'pending']" />
                  <span class="dim" style="font-size:10px">{{ (s.image_url || s.imageUrl) ? $t('episode.scenes.hasImage') : (isPendingSceneImage(s.id) ? $t('episode.status.generating') : (isPendingSceneUpload(s.id) ? $t('episode.status.uploading') : $t('episode.status.pending'))) }}</span>
                  <div class="asset-foot-actions">
                    <button
                      class="btn btn-sm"
                      :class="{ 'btn-ghost': !!(s.image_url || s.imageUrl) }"
                      :disabled="isPendingSceneImage(s.id) || isPendingSceneUpload(s.id)"
                      @click="genSceneImg(s.id)"
                    >
                      {{ isPendingSceneImage(s.id) ? $t('episode.status.generating') : $t('episode.scenes.aiGenerate') }}
                      <span v-if="!isPendingSceneImage(s.id)" class="btn-credit">{{ creditTag(imageCost) }}</span>
                    </button>
                    <button
                      class="btn btn-sm btn-ghost"
                      :disabled="isPendingSceneImage(s.id) || isPendingSceneUpload(s.id)"
                      @click="pickSceneUpload(s.id)"
                    >
                      {{ isPendingSceneUpload(s.id) ? $t('episode.status.uploading') : $t('episode.scenes.localUpload') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <input
              ref="sceneUploadInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              class="hidden-file-input"
              @change="onSceneFilePicked"
            />
          </div>

          <!-- Sub: Dubbing 已移除：不再生成配音，直接拼接视频 -->

          <!-- Sub: Shots -->
          <div v-else-if="prodTab === 'shots'" class="prod-content">
            <div class="prod-section-bar">
              <span class="dim" style="font-size:12px">{{ $t('episode.shots.shotCount', { n: sbs.length }) }}</span>
              <span class="tag mono">{{ $t('episode.shots.frameCount', { n: shotImgCount, total: sbs.length }) }}</span>
              <span class="tag">{{ lockedImageConfigLabel }}</span>
              <div class="ml-auto flex gap-1">
                <BaseSelect v-model="frameMode" :options="frameModeOptions" :placeholder="$t('episode.shots.frameModePh')" searchable style="width:100px" />
                <button v-if="gridImagePath" class="btn btn-sm" @click="reopenGridPreview">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ $t('episode.shots.viewCurrentGrid') }}
                </button>
                <button class="btn btn-primary btn-sm" @click="openGridTool">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  {{ $t('episode.grid.gridTool') }}
                </button>
              </div>
            </div>

            <div v-if="gridHistory.length" class="grid-history-panel">
              <div v-if="gridImagePath" class="latest-grid-strip">
                <button class="latest-grid-strip-thumb" @click="openImageViewer(staticUrl(gridImagePath), $t('episode.shots.currentGrid'))">
                  <img :src="staticUrl(gridImagePath)" class="previewable-image" />
                </button>
                <div class="latest-grid-strip-copy">
                  <div class="latest-grid-strip-head">
                    <span class="tag mono">{{ gridActualLayout.rows }}x{{ gridActualLayout.cols }}</span>
                    <span class="tag" v-if="gridRecoveredMode">{{ gridRecoveredMode }}</span>
                  </div>
                  <div class="latest-grid-strip-title">{{ $t('episode.shots.currentGrid') }}</div>
                  <div class="latest-grid-strip-meta">
                    <span v-if="gridRecoveredAt">{{ gridRecoveredAt }}</span>
                    <span>{{ $t('episode.shots.canContinueSplit') }}</span>
                  </div>
                </div>
                <div class="latest-grid-strip-actions">
                  <button class="btn btn-sm" @click="reopenGridPreview">{{ $t('episode.shots.preview') }}</button>
                  <button class="btn btn-primary btn-sm" @click="continueGridSplit">{{ $t('episode.shots.continueSplit') }}</button>
                </div>
              </div>
              <div class="grid-history-head">
                <div>
                  <div class="grid-history-title">{{ $t('episode.shots.gridHistory') }}</div>
                  <div class="grid-history-subtitle">{{ $t('episode.shots.gridHistorySub') }}</div>
                </div>
                <button class="btn btn-sm" @click="showAllGridHistory = !showAllGridHistory">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline :points="showAllGridHistory ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/></svg>
                  {{ showAllGridHistory ? $t('episode.shots.collapseHistory') : $t('episode.shots.expandAll', { n: gridHistory.length }) }}
                </button>
              </div>
              <div v-if="showAllGridHistory" class="grid-history-list">
                <button
                  v-for="item in gridHistory"
                  :key="item.id"
                  :class="['grid-history-item', { active: item.localPath === gridImagePath }]"
                  @click="selectGridHistory(item)"
                >
                  <div class="grid-history-thumb">
                    <img :src="staticUrl(item.localPath)" class="previewable-image" />
                  </div>
                  <div class="grid-history-copy">
                    <div class="grid-history-tags">
                      <span class="tag mono">#{{ item.id }}</span>
                      <span class="tag mono">{{ item.layout.rows }}x{{ item.layout.cols }}</span>
                      <span class="tag">{{ item.modeLabel }}</span>
                    </div>
                    <div class="grid-history-meta">{{ item.createdAtLabel }}</div>
                  </div>
                </button>
              </div>
            </div>

            <div class="frame-scroll">
              <div class="frame-grid">
                <div v-for="(sb, i) in sbs" :key="sb.id"
                  :class="['frame-row', 'card', { active: selectedSb?.id === sb.id }]"
                  @click="selectedSb = sb">
                  <!-- Info: number + type + desc -->
                  <div class="frame-info">
                    <div class="frame-top">
                      <span class="frame-num">#{{ String(i+1).padStart(2,'0') }}</span>
                      <span class="frame-badge">{{ shotTypeOf(sb) || '—' }}</span>
                    </div>
                    <div class="frame-desc">{{ sb.description || sb.title || '—' }}</div>
                    <div class="frame-meta">
                      <span :class="['dot', getFirstFrame(sb) && 'ok', isPendingShotFrame(sb.id, 'first_frame') && 'pending']" />
                      <span class="dim" style="font-size:11px">{{ $t('episode.storyboard.firstFrame') }}</span>
                      <span v-if="frameMode === 'first_last'" style="display:flex;align-items:center;gap:4px">
                        <span :class="['dot', getLastFrame(sb) && 'ok', isPendingShotFrame(sb.id, 'last_frame') && 'pending']" />
                        <span class="dim" style="font-size:11px">{{ $t('episode.storyboard.lastFrame') }}</span>
                      </span>
                    </div>
                  </div>
                  <!-- Thumbnails -->
                  <div class="frame-thumbs">
                    <div class="frame-thumb-wrap">
                      <div class="frame-thumb" @click.stop="!isPendingShotFrame(sb.id, 'first_frame') && genShotFrame(sb, 'first_frame')">
                        <img
                          v-if="getFirstFrame(sb)"
                          :src="staticUrl(getFirstFrame(sb))"
                          class="previewable-image"
                          @click.stop="openImageViewer(staticUrl(getFirstFrame(sb)), $t('episode.storyboard.firstFrameViewer', { n: String(i + 1).padStart(2, '0') }))"
                        />
                        <div v-else class="frame-thumb-empty">
                          <Loader2 v-if="isPendingShotFrame(sb.id, 'first_frame')" :size="14" class="animate-spin" />
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </div>
                        <span v-if="getFirstFrame(sb)" class="frame-re">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        </span>
                      </div>
                      <span class="frame-thumb-label">
                        {{ isPendingShotFrame(sb.id, 'first_frame') ? $t('episode.shots.firstFrameGenerating') : $t('episode.storyboard.firstFrame') }}
                        <span v-if="!getFirstFrame(sb) && !isPendingShotFrame(sb.id, 'first_frame')" class="frame-thumb-credit">{{ creditTag(imageCost) }}</span>
                      </span>
                    </div>
                    <div v-if="frameMode === 'first_last'" class="frame-thumb-wrap">
                      <div class="frame-thumb" @click.stop="!isPendingShotFrame(sb.id, 'last_frame') && genShotFrame(sb, 'last_frame')">
                        <img
                          v-if="getLastFrame(sb)"
                          :src="staticUrl(getLastFrame(sb))"
                          class="previewable-image"
                          @click.stop="openImageViewer(staticUrl(getLastFrame(sb)), $t('episode.storyboard.lastFrameViewer', { n: String(i + 1).padStart(2, '0') }))"
                        />
                        <div v-else class="frame-thumb-empty">
                          <Loader2 v-if="isPendingShotFrame(sb.id, 'last_frame')" :size="14" class="animate-spin" />
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </div>
                        <span v-if="getLastFrame(sb)" class="frame-re">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        </span>
                      </div>
                      <span class="frame-thumb-label">
                        {{ isPendingShotFrame(sb.id, 'last_frame') ? $t('episode.shots.lastFrameGenerating') : $t('episode.storyboard.lastFrame') }}
                        <span v-if="!getLastFrame(sb) && !isPendingShotFrame(sb.id, 'last_frame')" class="frame-thumb-credit">{{ creditTag(imageCost) }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grid Tool Dialog -->
            <div v-if="gridDialog" class="overlay" @click.self="gridDialog = false">
              <div class="card grid-tool" role="dialog" aria-modal="true" :aria-label="$t('episode.grid.gridTool')" :aria-busy="gridPromptLoading || gridStep === 2">
                <div class="grid-tool-head">
                  <span style="font-size:15px;font-weight:600;font-family:var(--font-display)">{{ $t('episode.grid.gridTool') }}</span>
                  <button class="btn btn-ghost btn-icon ml-auto" :aria-label="$t('episode.grid.closeGridTool')" @click="gridDialog = false">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <!-- Step 0: Config -->
                <div v-if="gridStep === 0" class="grid-tool-body">
                  <div class="grid-mode-tabs">
                    <button v-for="m in gridModes" :key="m.id"
                      :class="['grid-mode-tab', { active: gridMode === m.id }]"
                      @click="gridMode = m.id; gridSelected = []; gridSingleTarget = null; gridAssignmentsState = []">
                      <span style="font-weight:600">{{ m.label }}</span>
                      <span class="dim" style="font-size:11px">{{ m.desc }}</span>
                    </button>
                  </div>

                  <div class="grid-config">
                    <label class="field" style="flex:0 0 auto" v-if="gridMode !== 'multi_ref'">
                      <span class="field-label">{{ $t('episode.grid.gridLabel') }}</span>
                      <BaseSelect v-model="gridLayout" :options="gridLayoutOptions" :placeholder="$t('episode.grid.gridPh')" style="width:90px" />
                    </label>
                    <div class="field" style="flex:1">
                      <span class="field-label">
                        {{ gridMode === 'multi_ref' ? $t('episode.grid.selectTargetShot') : $t('episode.grid.selectShot') }}
                        <span class="dim" v-if="gridMode !== 'multi_ref'">({{ $t('episode.grid.selectedCount', { n: gridSelected.length }) }})</span>
                      </span>
                    </div>
                    <div style="align-self:flex-end" v-if="gridMode !== 'multi_ref'">
                      <button class="btn btn-sm" @click="gridSelectAll">{{ gridSelected.length === sbs.length ? $t('episode.grid.deselectAll') : $t('episode.grid.selectAll') }}</button>
                    </div>
                  </div>

                  <div class="grid-pick-list">
                    <label v-for="(sb, i) in sbs" :key="sb.id"
                      :class="['grid-pick-item', { selected: gridMode === 'multi_ref' ? gridSingleTarget === sb.id : gridSelected.includes(sb.id) }]">
                      <input v-if="gridMode === 'multi_ref'" type="radio" :value="sb.id" v-model="gridSingleTarget" name="grid-target" />
                      <input v-else type="checkbox" :value="sb.id" v-model="gridSelected" />
                      <span class="mono" style="font-size:11px;width:28px">#{{ String(i+1).padStart(2,'0') }}</span>
                      <span class="truncate" style="flex:1;font-size:12px">{{ sb.description || sb.title || '—' }}</span>
                    </label>
                  </div>

                  <div class="grid-tool-foot">
                    <span v-if="gridCanStart" class="tag mono">{{ gridAutoLayout.rows }}x{{ gridAutoLayout.cols }} = {{ $t('episode.grid.cellCount', { n: gridAutoLayout.rows * gridAutoLayout.cols }) }}</span>
                    <span class="dim" style="font-size:11px">{{ gridPromptLoading ? gridPromptStatus : gridSummary }}</span>
                    <button class="btn btn-primary ml-auto" :disabled="!gridCanStart || gridPromptLoading" @click="generateGridPrompt">
                      <Loader2 v-if="gridPromptLoading" :size="12" class="animate-spin" />
                      <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {{ gridPromptLoading ? $t('episode.status.generating') : $t('episode.grid.genPrompt') }}
                      <span v-if="!gridPromptLoading" class="btn-credit">{{ creditTag(agentCost) }}</span>
                    </button>
                  </div>
                </div>

                <!-- Step 1: Prompt Preview -->
                <div v-else-if="gridStep === 1" class="grid-tool-body">
                  <div class="grid-prompt-summary">
                    <div class="grid-prompt-label">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      {{ $t('episode.grid.promptLabel') }}
                      <span v-if="gridPromptSource" class="tag ml-8">{{ gridPromptSource === 'agent' ? $t('episode.grid.aiGenerated') : $t('episode.grid.templateFallback') }}</span>
                    </div>
                    <div class="grid-prompt-text">{{ gridPromptText || $t('episode.grid.awaitingGeneration') }}</div>
                  </div>

                  <div class="grid-blank-preview" :style="gridBlankStyle">
                    <div v-for="(cell, i) in gridCellPrompts" :key="i" class="grid-blank-cell">
                      <div class="grid-blank-cell-index">#{{ cell.shot_number }} {{ {first_frame:$t('episode.grid.firstFrame'),last_frame:$t('episode.grid.lastFrame'),reference:$t('episode.grid.reference')}[cell.frame_type] || '' }}</div>
                      <div class="grid-blank-cell-desc">{{ cell.prompt }}</div>
                    </div>
                    <div v-for="i in Math.max(0, (gridAutoLayout.rows * gridAutoLayout.cols) - gridCellPrompts.length)" :key="'empty-'+i" class="grid-blank-cell empty">
                      <div class="grid-blank-cell-index">{{ $t('episode.grid.empty') }}</div>
                      <div class="grid-blank-cell-desc">—</div>
                    </div>
                  </div>

                  <div class="grid-tool-foot">
                    <button class="btn" @click="gridStep = 0">{{ $t('episode.nav.prevStep') }}</button>
                    <button class="btn ml-auto" @click="generateGridPrompt" :disabled="gridPromptLoading">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      {{ $t('episode.grid.regenerate') }}
                      <span class="btn-credit">{{ creditTag(agentCost) }}</span>
                    </button>
                    <button class="btn btn-primary" @click="startGridGen">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {{ $t('episode.grid.genGrid') }}
                      <span class="btn-credit">{{ creditTag(imageCost) }}</span>
                    </button>
                  </div>
                </div>

                <!-- Step 2: Generating -->
                <div v-else-if="gridStep === 2" class="grid-tool-body" style="align-items:center;justify-content:center;min-height:300px">
                  <Loader2 :size="28" class="animate-spin" style="color:var(--cyan)" />
                  <div class="loading-text" style="margin-top:12px">{{ $t('episode.grid.gridGenerating') }}</div>
                  <div class="dim" style="font-size:11px;margin-top:6px">{{ gridStatusText }}</div>
                </div>

                <!-- Step 3: Preview -->
                <div v-else-if="gridStep === 3" class="grid-tool-body grid-tool-body-preview">
                  <div class="grid-preview-layout">
                    <div class="grid-preview-pane">
                      <div class="grid-preview-wrap">
                        <div class="grid-preview-stage">
                          <img
                            :src="staticUrl(gridImagePath)"
                            class="grid-preview-img previewable-image"
                            @click.stop="openImageViewer(staticUrl(gridImagePath), $t('episode.grid.gridPreview'))"
                          />
                          <div class="grid-overlay" :style="gridOverlayStyle">
                            <button
                              v-for="(a, i) in gridAssignments"
                              :key="i"
                              type="button"
                              :class="['grid-overlay-cell', activeGridCell === i && 'active']"
                              :aria-label="$t('episode.grid.cellAria', { n: i + 1, label: gridCellLabel(a) })"
                              :aria-pressed="activeGridCell === i"
                              @click="focusGridCell(i)"
                            >
                              <span class="grid-cell-label">{{ gridCellLabel(a) }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div class="grid-adjust-summary">
                        <span class="tag mono">{{ gridActualLayout.rows }}x{{ gridActualLayout.cols }} = {{ $t('episode.grid.cellCount', { n: gridActualLayout.rows * gridActualLayout.cols }) }}</span>
                        <span class="dim" style="font-size:12px">{{ $t('episode.grid.assignedCells', { n: gridAssignedCount, total: gridAssignments.length }) }}</span>
                        <span class="tag" v-if="gridAssignedCount < gridAssignments.length">{{ $t('episode.grid.unassignedIgnored') }}</span>
                      </div>
                    </div>
                    <div class="grid-assignment-pane">
                      <div class="grid-assign-head">
                        <div class="grid-assign-title">{{ $t('episode.grid.assignTitle') }}</div>
                        <div class="grid-assign-subtitle">{{ $t('episode.grid.assignSub') }}</div>
                      </div>
                      <div v-if="gridAssignmentTotalPages > 1" class="grid-assign-pagination">
                        <button class="btn btn-sm" :disabled="gridAssignmentPage === 0" @click="gridAssignmentPage--">{{ $t('episode.grid.prevPage') }}</button>
                        <span class="dim">{{ $t('episode.grid.pageInfo', { n: gridAssignmentPage + 1, total: gridAssignmentTotalPages }) }}</span>
                        <span class="dim">{{ gridAssignmentPageStart + 1 }}-{{ gridAssignmentPageEnd }} / {{ gridAssignments.length }}</span>
                        <button class="btn btn-sm ml-auto" :disabled="gridAssignmentPage >= gridAssignmentTotalPages - 1" @click="gridAssignmentPage++">{{ $t('episode.grid.nextPage') }}</button>
                      </div>
                      <div class="grid-assign-columns">
                        <span>{{ $t('episode.grid.colCell') }}</span>
                        <span>{{ $t('episode.grid.colShot') }}</span>
                        <span>{{ $t('episode.grid.colType') }}</span>
                        <span>{{ $t('episode.grid.colCurrent') }}</span>
                      </div>
                      <div class="grid-assign-info">
                        <div v-for="item in pagedGridAssignments" :key="item.index" :class="['grid-assign-row', activeGridCell === item.index && 'active']">
                          <span class="grid-assign-index">{{ $t('episode.grid.cellN', { n: item.index + 1 }) }}</span>
                          <BaseSelect
                            :model-value="item.assignment.storyboard_id"
                            :options="gridAssignmentShotOptions"
                            :placeholder="$t('episode.grid.selectShot')"
                            @update:model-value="updateGridAssignment(item.index, 'storyboard_id', $event)"
                          />
                          <BaseSelect
                            :model-value="item.assignment.frame_type"
                            :options="gridFrameTypeOptions"
                            :placeholder="$t('episode.grid.frameTypePh')"
                            style="width:100%"
                            @update:model-value="updateGridAssignment(item.index, 'frame_type', $event)"
                          />
                          <span class="grid-assign-bind">{{ gridCellTitle(item.assignment.storyboard_id) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="grid-tool-foot">
                    <button class="btn" @click="gridStep = 1">{{ $t('episode.grid.back') }}</button>
                    <button class="btn btn-primary ml-auto" @click="doGridSplit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                      {{ $t('episode.grid.splitAssign') }}
                      <span class="btn-credit is-free">{{ freeTag() }}</span>
                    </button>
                  </div>
                </div>

                <!-- Step 4: Done -->
                <div v-else-if="gridStep === 4" class="grid-tool-body" style="align-items:center;justify-content:center;min-height:200px">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div style="font-size:17px;font-weight:700;font-family:var(--font-display);margin-top:8px">{{ $t('episode.grid.assignDone') }}</div>
                  <div class="dim" style="font-size:13px;margin-top:4px">{{ $t('episode.grid.assignedCellsN', { n: gridAssignedCount }) }}</div>
                  <button class="btn btn-primary" style="margin-top:16px" @click="gridDialog = false; refresh()">{{ $t('episode.grid.close') }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub: Videos -->
          <div v-else-if="prodTab === 'videos'" class="prod-content">
            <div class="prod-section-bar">
              <span class="dim" style="font-size:12px">{{ $t('episode.shots.shotCount', { n: sbs.length }) }}</span>
              <span class="tag mono">{{ $t('episode.videos.vidCount', { n: shotVidCount, total: sbs.length }) }}</span>
              <div class="ml-auto flex gap-1">
                <button class="btn btn-sm" @click="batchVideos">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  {{ $t('episode.videos.batchVideos') }}
                  <span v-if="pendingVideoShots.length" class="btn-credit">{{ creditTag(pendingVideoBatchCredits) }}</span>
                </button>
              </div>
            </div>
            <div class="prod-grid">
              <div v-for="(sb, i) in sbs" :key="sb.id" class="card prod-card">
                <div class="prod-cover">
                  <video
                    v-if="hasVid(sb)"
                    :src="staticUrl(getVideoUrl(sb))"
                    class="prod-video"
                    controls
                    preload="metadata"
                    playsinline
                  />
                  <img
                    v-else-if="hasImg(sb)"
                    :src="staticUrl(getStoryboardCover(sb))"
                    class="previewable-image"
                    @click.stop="openImageViewer(staticUrl(getStoryboardCover(sb)), $t('episode.storyboard.refImageViewer', { n: String(i + 1).padStart(2, '0') }))"
                  />
                  <div v-else class="prod-cover-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  </div>
                  <span class="prod-idx">#{{ String(i+1).padStart(2,'0') }}</span>
                  <span v-if="hasComposed(sb)" class="prod-overlay-badge">{{ $t('episode.videos.composed') }}</span>
                </div>
                <div class="prod-info">
                  <div class="prod-desc truncate">{{ sb.description || sb.title || '—' }}</div>
                  <div class="prod-meta-line">{{ shotTypeOf(sb) || $t('episode.storyboard.noShotTypeShort') }} · {{ sb.duration || 10 }}s</div>
                  <div class="prod-dots">
                    <span :class="['dot', hasImg(sb) && 'ok']" /><span style="font-size:10px">{{ $t('episode.videos.img') }}</span>
                    <span :class="['dot', hasVid(sb) && 'ok', isPendingVideo(sb.id) && 'pending']" /><span style="font-size:10px">{{ isPendingVideo(sb.id) ? $t('episode.videos.videoGenerating') : $t('episode.videos.video') }}</span>
                  </div>
                  <div v-if="videoFailMessage(sb.id)" class="prod-error" role="status">{{ videoFailMessage(sb.id) }}</div>
                </div>
                <div class="prod-actions">
                  <button class="btn btn-sm" :disabled="isPendingVideo(sb.id)" @click="genVid(sb)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    {{ isPendingVideo(sb.id) ? $t('episode.status.generating') : $t('episode.videos.genVideo') }}
                    <span v-if="videoPriceLabel(sb)" class="btn-credit">{{ videoPriceLabel(sb) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sub: Compose -->
          <div v-else-if="prodTab === 'compose'" class="prod-content">
            <div class="prod-section-bar">
              <span class="dim" style="font-size:12px">{{ $t('episode.shots.shotCount', { n: sbs.length }) }}</span>
              <span class="tag mono">{{ $t('episode.compose.composedCountLabel', { n: composedCount, total: sbs.length }) }}</span>
              <div class="ml-auto flex gap-1">
                <button class="btn btn-sm" @click="batchCompose">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  {{ $t('episode.compose.batchCompose') }}
                  <span class="btn-credit is-free">{{ freeTag() }}</span>
                </button>
              </div>
            </div>
            <div class="prod-grid">
              <div v-for="(sb, i) in sbs" :key="sb.id" class="card prod-card">
                <div class="prod-cover">
                  <video
                    v-if="hasComposed(sb)"
                    :src="staticUrl(getComposedVideoUrl(sb))"
                    class="prod-video"
                    controls
                    preload="metadata"
                    playsinline
                  />
                  <video
                    v-else-if="hasVid(sb)"
                    :src="staticUrl(getVideoUrl(sb))"
                    class="prod-video"
                    controls
                    preload="metadata"
                    playsinline
                  />
                  <img
                    v-else-if="hasImg(sb)"
                    :src="staticUrl(getStoryboardCover(sb))"
                    class="previewable-image"
                    @click.stop="openImageViewer(staticUrl(getStoryboardCover(sb)), $t('episode.storyboard.refImageViewer', { n: String(i + 1).padStart(2, '0') }))"
                  />
                  <div v-else class="prod-cover-empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  </div>
                  <span class="prod-idx">#{{ String(i+1).padStart(2,'0') }}</span>
                  <span v-if="hasComposed(sb)" class="prod-overlay-badge">{{ $t('episode.videos.composed') }}</span>
                </div>
                <div class="prod-info">
                  <div class="prod-desc truncate">{{ sb.description || sb.title || '—' }}</div>
                  <div class="prod-meta-line">{{ shotTypeOf(sb) || $t('episode.storyboard.noShotTypeShort') }} · {{ sb.duration || 10 }}s</div>
                  <div class="prod-dots">
                    <span :class="['dot', hasVid(sb) && 'ok']" /><span style="font-size:10px">{{ $t('episode.videos.video') }}</span>
                    <span :class="['dot', hasTTS(sb) && 'ok']" /><span style="font-size:10px">{{ $t('episode.compose.dub') }}</span>
                    <span :class="['dot', hasComposed(sb) && 'ok', isPendingCompose(sb.id) && 'pending']" /><span style="font-size:10px">{{ isPendingCompose(sb.id) ? $t('episode.compose.composing') : $t('episode.compose.compose') }}</span>
                  </div>
                  <div v-if="composeFailMessage(sb.id)" class="prod-error" role="status">{{ composeFailMessage(sb.id) }}</div>
                </div>
                <div class="prod-actions">
                  <button class="btn btn-sm" :disabled="!hasVid(sb) || isPendingCompose(sb.id)" @click="doCompose(sb)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    {{ isPendingCompose(sb.id) ? $t('episode.compose.composing') : (hasComposed(sb) ? $t('episode.compose.recompose') : $t('episode.compose.startCompose')) }}
                    <span v-if="!isPendingCompose(sb.id)" class="btn-credit is-free">{{ freeTag() }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Production Navigator -->
        </template>
      </div>

      <!-- ===== EXPORT PANEL ===== -->
      <div v-else class="content-panel">
        <div v-if="!sbs.length" class="step-empty" style="flex:1">
          <div class="empty-visual">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="empty-title">{{ $t('episode.export.notReady') }}</div>
          <div class="empty-desc">{{ $t('episode.export.needProduction') }}</div>
          <button class="btn btn-primary" @click="panel = 'script'">{{ $t('episode.export.goToScript') }}</button>
        </div>
        <div v-else class="export-split">
          <div class="export-main">
            <template v-if="mergeUrl">
              <video ref="exportVideoEl" :src="staticUrl(mergeUrl)" controls class="export-video" />
              <div class="export-bar">
                <span class="tag tag-success">{{ $t('episode.export.mergeDone') }}</span>
                <span class="dim" style="font-size:12px">{{ mergeClipLabel }} · {{ totalDuration }}s</span>
                <button class="btn" :disabled="mergeableVidCount < MIN_MERGE_CLIPS || merging" @click="doMerge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  {{ merging ? $t('episode.export.merging') : $t('episode.export.remerge') }}
                  <span v-if="!merging" class="btn-credit is-free">{{ freeTag() }}</span>
                </button>
                <button class="btn ml-auto" @click="fullscreenMerged">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                  {{ $t('episode.export.fullscreen') }}
                </button>
                <button class="btn btn-primary" :disabled="downloadingMerge" @click="downloadMerged">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {{ downloadingMerge ? $t('episode.export.downloading') : $t('episode.export.downloadVideo') }}
                </button>
              </div>
            </template>
            <template v-else>
              <div class="step-empty">
                <div class="empty-visual">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <div class="empty-title">{{ $t('episode.export.mergePreviewTitle') }}</div>
                <div class="empty-desc">
                  <template v-if="mergeableVidCount >= MIN_MERGE_CLIPS">
                    {{ $t('episode.export.mergeReadyDesc', { n: mergeableVidCount, total: sbs.length }) }}
                  </template>
                  <template v-else>
                    {{ $t('episode.export.mergeNeedMore', { min: MIN_MERGE_CLIPS, n: mergeableVidCount, total: sbs.length }) }}
                  </template>
                </div>
                <button class="btn btn-primary" :disabled="mergeableVidCount < MIN_MERGE_CLIPS || merging" @click="doMerge" style="margin-top:12px">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  {{ merging ? $t('episode.export.merging') : $t('episode.export.startMerge') }}
                  <span v-if="!merging" class="btn-credit is-free">{{ freeTag() }}</span>
                </button>
              </div>
            </template>
          </div>
          <div class="export-list">
            <div class="export-list-head">{{ $t('episode.export.shotOverview') }}</div>
            <div class="export-list-body">
              <div v-for="(sb, i) in sbs" :key="sb.id" class="exp-row">
                <span class="mono dim" style="font-size:10px">#{{ String(i+1).padStart(2,'0') }}</span>
                <span class="truncate" style="flex:1;font-size:11px">{{ sb.description || sb.title || '—' }}</span>
                <span :class="['dot', hasVid(sb) && 'ok']" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showBottomBubble" class="step-bubble">
        <button
          v-if="panel === 'script'"
          class="bubble-btn"
          :disabled="scriptStep === 0"
          @click="goPrevStep"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ prevStepLabel || $t('episode.nav.prevStep') }}
        </button>
        <button
          v-else-if="panel === 'production'"
          class="bubble-btn"
          :disabled="prodTabIdx === 0"
          @click="prodTabIdx = Math.max(0, prodTabIdx - 1)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ prodTabDefs[Math.max(0, prodTabIdx - 1)]?.label || $t('episode.nav.prevStep') }}
        </button>

        <div class="bubble-dots">
          <button
            v-for="step in bubbleSteps"
            :key="step.key"
            :class="['bubble-dot', { done: step.done, current: step.key === activeBubbleKey }]"
            @click="goSubStep(step.key)"
            :title="step.label"
            :aria-label="step.label"
            :aria-current="activeSubStepKey === step.key ? 'step' : undefined"
          ></button>
        </div>

        <button
          v-if="scriptStepAction"
          class="bubble-btn regen"
          :disabled="rn || !scriptStepAction.ready"
          :title="!scriptStepAction.ready ? scriptStepAction.blockedHint : $t('episode.nav.rerunStepTitle')"
          @click="runScriptStepAction"
        >
          <Loader2 v-if="rn && rt === scriptStepAction.key" :size="12" class="animate-spin" />
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/>
          </svg>
          {{ rn && rt === scriptStepAction.key ? $t('episode.status.generating') : scriptStepAction.label }}
          <span class="btn-credit">{{ creditTag(agentCost) }}</span>
        </button>

        <button
          v-if="panel === 'script'"
          class="bubble-btn primary"
          :disabled="!canGoNext"
          @click="goNextStep"
        >
          {{ nextStepLabel || $t('episode.nav.nextStep') }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <button
          v-else-if="panel === 'production'"
          class="bubble-btn primary"
          :disabled="panel === 'production' && prodTab === 'compose' && !canExport"
          @click="goNextProd"
        >
          {{ prodTabIdx < prodTabDefs.length - 1 ? (prodTabDefs[prodTabIdx + 1]?.label || $t('episode.nav.nextStep')) : $t('episode.nav.toExport') }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      <div v-if="imageViewer.open && imageViewer.src" class="overlay image-viewer-overlay" @click.self="closeImageViewer">
        <div class="card image-viewer-dialog" role="dialog" aria-modal="true" aria-labelledby="image-viewer-title">
          <div class="image-viewer-head">
            <div id="image-viewer-title" class="image-viewer-title">{{ imageViewer.title || $t('episode.imageViewer.imagePreview') }}</div>
            <button class="btn btn-ghost btn-icon" :aria-label="$t('episode.imageViewer.closeImagePreview')" @click="closeImageViewer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="image-viewer-body">
            <img :src="imageViewer.src" :alt="imageViewer.title || $t('episode.imageViewer.imagePreview')" class="image-viewer-img" />
          </div>
        </div>
      </div>
    </main>
    </div>
  </div>
</template>

<script setup>
import { toast } from 'vue-sonner'
import {
  Users, MapPin, Video, ImageIcon, Layers, Mic2, FileText, FolderKanban, Clapperboard, Download, Loader2,
} from 'lucide-vue-next'
import { dramaAPI, episodeAPI, storyboardAPI, characterAPI, sceneAPI, imageAPI, videoAPI, composeAPI, mergeAPI, gridAPI, aiConfigAPI, voicesAPI } from '~/composables/useApi'
import { staticUrl } from '~/utils/api-base'
import { useAgent } from '~/composables/useAgent'
import BaseSelect from '~/components/BaseSelect.vue'

definePageMeta({ layout: 'studio' })

const { t, locale } = useLocale()

const route = useRoute()
const dramaId = Number(route.params.id)
const episodeNumber = Number(route.params.episodeNumber)

const drama = ref(null), episode = ref(null), chars = ref([]), scenes = ref([]), sbs = ref([]), mergeData = ref(null)
const panel = ref('script')
const { running: rn, runningType: rt, run: runAgent } = useAgent()
const { refresh: refreshCredits, formatVideoButtonCredits, sumVideoChargeCredits, agentCost, imageCost, creditTag, freeTag } = useCredits()
const {
  lockedImageLabel,
  lockedVideoLabel,
  videoConfigOptionLabel,
  audioConfigOptionLabel,
} = useGenerationConfigLabels()

const localRaw = ref(''), localScript = ref('')
const rawContent = computed(() => episode.value?.content || '')
const scriptContent = computed(() => episode.value?.script_content || episode.value?.scriptContent || '')
const epId = computed(() => episode.value?.id || 0)
const rawLen = computed(() => localRaw.value.replace(/\s/g, '').length || 0)
const scriptLen = computed(() => localScript.value.replace(/\s/g, '').length || 0)
const charsVoiced = computed(() => chars.value.filter(c => c.voice_style || c.voiceStyle).length)
const voiceSampleCount = computed(() => chars.value.filter(c => c.voice_sample_url || c.voiceSampleUrl).length)
const composedCount = computed(() => sbs.value.filter(s => s.composed_video_url || s.composedVideoUrl).length)
const mergeUrl = computed(() => mergeData.value?.merged_url || mergeData.value?.mergedUrl || null)
const merging = ref(false)

const scriptStep = ref(0)
const prodTab = ref('chars')
const prodTabIdx = computed({
  get: () => prodTabDefs.value.findIndex(t => t.id === prodTab.value),
  set: (v) => { prodTab.value = prodTabDefs.value[v]?.id || 'chars' },
})
const frameMode = ref('first')
const fallbackVoiceProfiles = computed(() => [
  { id: 'alloy', label: 'Alloy', gender: 'neutral', traits: t('episode.voice.alloyTraits'), suitable: t('episode.voice.alloySuitable') },
  { id: 'echo', label: 'Echo', gender: 'male', traits: t('episode.voice.echoTraits'), suitable: t('episode.voice.echoSuitable') },
  { id: 'fable', label: 'Fable', gender: 'male', traits: t('episode.voice.fableTraits'), suitable: t('episode.voice.fableSuitable') },
  { id: 'onyx', label: 'Onyx', gender: 'male', traits: t('episode.voice.onyxTraits'), suitable: t('episode.voice.onyxSuitable') },
  { id: 'nova', label: 'Nova', gender: 'female', traits: t('episode.voice.novaTraits'), suitable: t('episode.voice.novaSuitable') },
  { id: 'shimmer', label: 'Shimmer', gender: 'female', traits: t('episode.voice.shimmerTraits'), suitable: t('episode.voice.shimmerSuitable') },
])
const rawVoiceProfiles = ref(null)
const voiceProfiles = computed(() => {
  const rows = rawVoiceProfiles.value
  const base = rows && rows.length ? rows.map(mapVoiceProfile) : fallbackVoiceProfiles.value
  return base.map(v => ({ ...v, gender: t(`episode.voice.gender.${v.gender}`) }))
})
const voiceSelectOptions = computed(() => voiceProfiles.value.map(v => ({ label: `${v.label} · ${v.traits}`, value: v.id })))
const videoConfigSelectOptions = computed(() => videoConfigs.value.map((c, i) => ({
  label: videoConfigOptionLabel(c, i),
  value: c.id,
})))
const frameModeOptions = computed(() => [
  { label: t('episode.shots.frameModeFirst'), value: 'first' },
  { label: t('episode.shots.frameModeFirstLast'), value: 'first_last' },
])
const gridLayoutOptions = [
  { label: '2x2', value: '2x2' },
  { label: '3x3', value: '3x3' },
  { label: '4x4', value: '4x4' },
  { label: '5x5', value: '5x5' },
]
const imageConfigs = ref([])
const videoConfigs = ref([])
const audioConfigs = ref([])
const pendingCharImageIds = ref([])
const pendingSceneImageIds = ref([])
const pendingSceneUploadIds = ref([])
const sceneUploadInput = ref(null)
const sceneUploadTargetId = ref(null)
const pendingShotFrameKeys = ref([])
const pendingVideoIds = ref([])
const pendingComposeIds = ref([])
const failedVideoMessages = ref({})
const failedComposeMessages = ref({})
const imageViewer = ref({ open: false, src: '', title: '' })

function configLabel(config) {
  if (!config) return t('episode.status.notConfigured')
  if (config.service_type === 'image' || config.serviceType === 'image') return lockedImageLabel()
  if (config.service_type === 'video' || config.serviceType === 'video') return lockedVideoLabel()
  if (config.service_type === 'audio' || config.serviceType === 'audio') return audioConfigOptionLabel(config)
  return t('episode.status.locked')
}

function isPendingCharImage(id) {
  return pendingCharImageIds.value.includes(id)
}

function openImageViewer(src, title = '') {
  if (!src) return
  imageViewer.value = { open: true, src, title }
}

function closeImageViewer() {
  imageViewer.value = { open: false, src: '', title: '' }
}

function handleImageViewerKeydown(event) {
  if (event.key === 'Escape' && imageViewer.value.open) closeImageViewer()
}

onMounted(() => {
  window.addEventListener('keydown', handleImageViewerKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleImageViewerKeydown)
})

function isPendingSceneImage(id) {
  return pendingSceneImageIds.value.includes(id)
}

function isPendingSceneUpload(id) {
  return pendingSceneUploadIds.value.includes(id)
}

function framePendingKey(id, frameType) {
  return `${id}:${frameType}`
}

function isPendingShotFrame(id, frameType) {
  return pendingShotFrameKeys.value.includes(framePendingKey(id, frameType))
}

function isPendingVideo(id) {
  return pendingVideoIds.value.includes(id)
}

function videoFailMessage(id) {
  return failedVideoMessages.value[id] || ''
}

function isPendingCompose(id) {
  return pendingComposeIds.value.includes(id)
}

function composeFailMessage(id) {
  return failedComposeMessages.value[id] || ''
}

function isNarratorCharacter(char) {
  const text = `${char?.name || ''} ${char?.role || ''}`.toLowerCase()
  return text.includes('旁白') || text.includes('narrator') || text.includes('画外音')
}

const visualChars = computed(() => chars.value.filter(c => !isNarratorCharacter(c)))
const pendingCharImageCount = computed(() => visualChars.value.filter(c => !(c.image_url || c.imageUrl)).length)
const pendingSceneImageCount = computed(() => scenes.value.filter(s => !(s.image_url || s.imageUrl)).length)
const pendingVideoShots = computed(() => sbs.value.filter(s => !(s?.video_url || s?.videoUrl)))
const pendingCharBatchCredits = computed(() => pendingCharImageCount.value * imageCost.value)
const pendingSceneBatchCredits = computed(() => pendingSceneImageCount.value * imageCost.value)
const pendingVideoBatchCredits = computed(() => sumVideoChargeCredits(pendingVideoShots.value))

const lockedImageConfigId = computed(() => episode.value?.image_config_id || episode.value?.imageConfigId || null)
const lockedVideoConfigId = computed(() => episode.value?.video_config_id || episode.value?.videoConfigId || null)
const lockedAudioConfigId = computed(() => episode.value?.audio_config_id || episode.value?.audioConfigId || null)
const lockedAudioProvider = computed(() => audioConfigs.value.find(c => c.id === lockedAudioConfigId.value)?.provider || '')
const lockedImageConfigLabel = computed(() => configLabel(imageConfigs.value.find(c => c.id === lockedImageConfigId.value)))
const lockedVideoConfigLabel = computed(() => configLabel(videoConfigs.value.find(c => c.id === lockedVideoConfigId.value)))
const lockedAudioConfigLabel = computed(() => configLabel(audioConfigs.value.find(c => c.id === lockedAudioConfigId.value)))

// Grid tool state
const gridDialog = ref(false)
const gridStep = ref(0)
const gridLayout = ref('3x3')
const gridMode = ref('first_frame')
const gridSelected = ref([])
const gridSingleTarget = ref(null)
const gridGenId = ref(null)
const gridImagePath = ref('')
const gridStatusText = ref('')
const gridActualLayout = ref({ rows: 3, cols: 3 })
const gridRecoveredAt = ref('')
const gridRecoveredMode = ref('')
const gridPromptText = ref('')
const gridCellPrompts = ref([])
const gridPromptSource = ref('')
const gridPromptLoading = ref(false)
const gridPromptStatus = ref('')
const gridAssignmentsState = ref([])
const gridActiveShotIds = ref([])
const gridHistory = ref([])
const showAllGridHistory = ref(false)
const activeGridCell = ref(0)
const gridAssignmentPage = ref(0)
const gridStorageKey = computed(() => `huobao:grid:${dramaId}:${epId.value || episodeNumber}`)

const gridModes = computed(() => [
  { id: 'first_frame', label: t('episode.grid.modeFirst'), desc: t('episode.grid.modeFirstDesc') },
  { id: 'first_last', label: t('episode.grid.modeFirstLast'), desc: t('episode.grid.modeFirstLastDesc') },
  { id: 'multi_ref', label: t('episode.grid.modeMultiRef'), desc: t('episode.grid.modeMultiRefDesc') },
])

const gridLayoutShape = computed(() => {
  const [rows, cols] = String(gridLayout.value || '3x3').split('x').map(Number)
  return {
    rows: rows || 3,
    cols: cols || 3,
  }
})
const gridTotalCells = computed(() => {
  return gridLayoutShape.value.rows * gridLayoutShape.value.cols
})

const gridCanStart = computed(() => {
  if (gridMode.value === 'multi_ref') return !!gridSingleTarget.value
  return gridSelected.value.length > 0
})

const gridSummary = computed(() => {
  if (gridMode.value === 'multi_ref') {
    const idx = sbs.value.findIndex(s => s.id === gridSingleTarget.value) + 1
    return gridSingleTarget.value
      ? t('episode.grid.summaryMultiRef', { rows: gridLayoutShape.value.rows, cols: gridLayoutShape.value.cols, n: idx })
      : t('episode.grid.pickOneShot')
  }
  if (!gridSelected.value.length) return t('episode.grid.pickShot')
  const count = gridSelected.value.length
  if (gridMode.value === 'first_last') {
    const { rows, cols } = gridLayoutShape.value
    return t('episode.grid.summaryFirstLast', { n: count, rows, cols })
  }
  const { rows, cols } = gridLayoutShape.value
  const cells = rows * cols
  return t('episode.grid.summaryDefault', { n: count, rows, cols })
})

function createGridAssignments() {
  return Array.from({ length: gridActualLayout.value.rows * gridActualLayout.value.cols }, () => ({
    storyboard_id: null,
    frame_type: 'first_frame',
  }))
}

const gridAssignments = computed(() => gridAssignmentsState.value)
const gridAssignableShotIds = computed(() => {
  const assignedIds = [...new Set(gridAssignments.value.map(item => item?.storyboard_id).filter(Boolean))]
  const ids = Array.isArray(gridActiveShotIds.value) && gridActiveShotIds.value.length
    ? gridActiveShotIds.value
    : assignedIds.length
      ? assignedIds
    : gridMode.value === 'multi_ref'
      ? (gridSingleTarget.value ? [gridSingleTarget.value] : [])
      : gridSelected.value.length
        ? [...gridSelected.value]
        : sbs.value.map(s => s.id)
  return ids.filter(id => sbs.value.some(s => s.id === id))
})
const gridAssignmentShotOptions = computed(() => [
  { label: t('episode.grid.unassigned'), value: null },
  ...gridAssignableShotIds.value.map((id) => {
    const index = sbs.value.findIndex(s => s.id === id) + 1
    const sb = sbs.value.find(s => s.id === id)
    return {
      label: t('episode.grid.shotOption', { n: String(index).padStart(2, '0'), title: sb?.title || sb?.description || t('episode.grid.shot') }),
      value: id,
    }
  }),
])
const gridFrameTypeOptions = computed(() => {
  return [
    { label: t('episode.grid.firstFrame'), value: 'first_frame' },
    { label: t('episode.grid.lastFrame'), value: 'last_frame' },
    { label: t('episode.grid.reference'), value: 'reference' },
  ]
})
const gridAssignedCount = computed(() => gridAssignments.value.filter(item => !!item.storyboard_id).length)
const gridAssignmentPageSize = computed(() => {
  if (gridAssignments.value.length >= 25) return 8
  if (gridAssignments.value.length >= 16) return 10
  if (gridAssignments.value.length >= 9) return 9
  return Math.max(1, gridAssignments.value.length || 1)
})
const gridAssignmentTotalPages = computed(() => Math.max(1, Math.ceil(gridAssignments.value.length / gridAssignmentPageSize.value)))
const gridAssignmentPageStart = computed(() => gridAssignmentPage.value * gridAssignmentPageSize.value)
const gridAssignmentPageEnd = computed(() => Math.min(gridAssignments.value.length, gridAssignmentPageStart.value + gridAssignmentPageSize.value))
const pagedGridAssignments = computed(() => {
  return gridAssignments.value
    .slice(gridAssignmentPageStart.value, gridAssignmentPageEnd.value)
    .map((assignment, offset) => ({
      assignment,
      index: gridAssignmentPageStart.value + offset,
    }))
})

function resetGridAssignments() {
  gridAssignmentsState.value = createGridAssignments()
  activeGridCell.value = 0
  gridAssignmentPage.value = 0
}

function gridCellLabel(a) {
  if (!a?.storyboard_id) return t('episode.grid.unassigned')
  const idx = sbs.value.findIndex(s => s.id === a.storyboard_id) + 1
  const suffix = { first_frame: t('episode.grid.suffixFirst'), last_frame: t('episode.grid.suffixLast'), reference: t('episode.grid.suffixRef') }[a.frame_type] || ''
  return `#${idx}${suffix ? ` ${suffix}` : ''}`
}

function gridCellTitle(id) {
  if (!id) return t('episode.grid.unassigned')
  const idx = sbs.value.findIndex(s => s.id === id) + 1
  const sb = sbs.value.find(s => s.id === id)
  return t('episode.grid.shotOption', { n: String(idx).padStart(2, '0'), title: sb?.title || sb?.description || t('episode.grid.shot') })
}

function updateGridAssignment(index, field, value) {
  const next = [...gridAssignmentsState.value]
  next[index] = { ...next[index], [field]: value }
  gridAssignmentsState.value = next
  activeGridCell.value = index
  if (gridImagePath.value) persistGridImagePath(gridImagePath.value)
}

function focusGridCell(index) {
  activeGridCell.value = index
  gridAssignmentPage.value = Math.floor(index / gridAssignmentPageSize.value)
}

const gridOverlayStyle = computed(() => {
  const { rows, cols } = gridActualLayout.value
  return { 'grid-template-columns': `repeat(${cols}, 1fr)`, 'grid-template-rows': `repeat(${rows}, 1fr)` }
})

const gridAutoLayout = computed(() => {
  return gridLayoutShape.value
})

const gridBlankStyle = computed(() => {
  const { rows, cols } = gridAutoLayout.value
  return { 'grid-template-columns': `repeat(${cols}, 1fr)`, 'grid-template-rows': `repeat(${rows}, 1fr)` }
})

// Production step helpers
function prodStepDone(id) {
  if (id === 'chars') return !visualCharTotal.value || charImgCount.value === visualCharTotal.value
  if (id === 'scenes') return !!scenes.value.length && sceneImgCount.value === scenes.value.length
  if (id === 'shots') return !!sbs.value.length && shotImgCount.value === sbs.value.length
  if (id === 'videos') return !!sbs.value.length && shotVidCount.value === sbs.value.length
  if (id === 'compose') return !!sbs.value.length && composedCount.value === sbs.value.length
  return false
}
const MIN_MERGE_CLIPS = 2
const canExport = computed(() => shotVidCount.value >= MIN_MERGE_CLIPS)
const mergeableVidCount = computed(() => shotVidCount.value)
const mergeClipLabel = computed(() => {
  const raw = mergeData.value?.scenes
  if (raw) {
    try {
      const clips = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(clips)) return t('episode.export.clipCount', { n: clips.length, total: sbs.value.length })
    } catch {}
  }
  return t('episode.export.clipCount', { n: mergeableVidCount.value, total: sbs.value.length })
})
function goNextProd() {
  if (prodTabIdx.value < prodTabDefs.value.length - 1) {
    prodTabIdx.value++
  } else {
    panel.value = 'export'
  }
}

// Script step navigation
const stepLabels = computed(() => [
  t('episode.script.stepRaw'),
  t('episode.script.stepRewrite'),
  t('episode.script.stepExtract'),
  t('episode.script.stepVoice'),
  t('episode.script.stepStoryboard'),
])
const prevStepLabel = computed(() => scriptStep.value > 0 ? stepLabels.value[scriptStep.value - 1] : '')
const nextStepLabel = computed(() => {
  if (scriptStep.value === 4) return t('episode.nav.toProduction')
  return stepLabels.value[scriptStep.value + 1] || ''
})
const canGoNext = computed(() => {
  if (scriptStep.value === 0) return !!localRaw.value.trim()
  if (scriptStep.value === 1) return !!localScript.value.trim() || !!scriptContent.value
  if (scriptStep.value === 2) return chars.value.length > 0
  if (scriptStep.value === 3) return charsVoiced.value > 0
  if (scriptStep.value === 4) return sbs.value.length > 0
  return false
})
function goPrevStep() { if (scriptStep.value > 0) scriptStep.value-- }
function goNextStep() {
  if (scriptStep.value === 0 && localRaw.value.trim()) { saveRaw() }
  if (scriptStep.value === 1 && localScript.value.trim()) { saveScr() }
  if (scriptStep.value === 4) { panel.value = 'production'; return }
  if (canGoNext.value) scriptStep.value++
}

// 当前剧本步骤的「重新生成」动作，与底部「下一步」并排，形成「满意就过、不满意就重做」的决策点。
// 原始内容（step 0）是人工输入，没有可重跑的 AI 动作，因此返回 null 不渲染按钮。
const scriptStepAction = computed(() => {
  if (panel.value !== 'script') return null
  switch (scriptStep.value) {
    case 1:
      return {
        key: 'script_rewriter',
        label: scriptContent.value ? t('episode.script.rewriteAgain') : t('episode.script.startRewrite'),
        run: doRewrite,
        hasResult: !!scriptContent.value,
        ready: !!(rawContent.value || localRaw.value.trim()),
        blockedHint: t('episode.script.needRaw'),
        confirmText: t('episode.script.confirmRewrite'),
      }
    case 2:
      return {
        key: 'extractor',
        label: chars.value.length ? t('episode.extract.reExtract') : t('episode.extract.startExtract'),
        run: doExtract,
        hasResult: chars.value.length > 0,
        ready: !!scriptContent.value,
        blockedHint: t('episode.extract.needScript'),
        confirmText: t('episode.extract.confirmReExtract'),
      }
    case 3:
      return {
        key: 'voice_assigner',
        label: charsVoiced.value ? t('episode.voice.reAssign') : t('episode.voice.startAssign'),
        run: doVoice,
        hasResult: charsVoiced.value > 0,
        ready: chars.value.length > 0,
        blockedHint: t('episode.voice.needChars'),
        confirmText: t('episode.voice.confirmReAssign'),
      }
    case 4:
      return {
        key: 'storyboard_breaker',
        label: sbs.value.length ? t('episode.storyboard.rebreak') : t('episode.storyboard.aiBreak'),
        run: doBreakdown,
        hasResult: sbs.value.length > 0,
        ready: !!scriptContent.value,
        blockedHint: t('episode.storyboard.needScript'),
        confirmText: t('episode.storyboard.confirmRebreak', { n: sbs.value.length }),
      }
    default:
      return null
  }
})

function runScriptStepAction() {
  const action = scriptStepAction.value
  if (!action || !action.ready) return
  // 已有产出时二次确认，避免误点覆盖掉已有结果（首次生成不打扰）
  if (action.hasResult && !confirm(action.confirmText)) return
  action.run()
}

function gridSelectAll() {
  if (gridSelected.value.length === sbs.value.length) gridSelected.value = []
  else gridSelected.value = sbs.value.map(s => s.id)
}

function openGridTool() {
  gridStep.value = 0
  gridSelected.value = []
  gridSingleTarget.value = null
  gridActiveShotIds.value = []
  gridPromptText.value = ''
  gridCellPrompts.value = []
  gridPromptSource.value = ''
  gridPromptStatus.value = ''
  gridAssignmentsState.value = []
  gridDialog.value = true
}

function persistGridImagePath(value) {
  if (typeof window === 'undefined') return
  if (!value) {
    window.localStorage.removeItem(gridStorageKey.value)
    return
  }
  const current = restoreGridState() || {}
  const entries = current.entries || {}
  entries[value] = {
    generationId: gridGenId.value,
    layout: gridActualLayout.value,
    shotIds: gridActiveShotIds.value,
    assignments: gridAssignmentsState.value,
    recoveredAt: gridRecoveredAt.value,
    recoveredMode: gridRecoveredMode.value,
  }
  const payload = {
    activeImagePath: value,
    entries,
  }
  window.localStorage.setItem(gridStorageKey.value, JSON.stringify(payload))
}

function restoreGridState() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(gridStorageKey.value)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return { activeImagePath: raw, entries: { [raw]: {} } }
  }
}

function applyGridState(imagePath, meta = {}) {
  gridImagePath.value = imagePath || ''
  gridGenId.value = meta.generationId || meta.id || null
  if (meta.layout?.rows && meta.layout?.cols) gridActualLayout.value = meta.layout
  if (Array.isArray(meta.shotIds)) gridActiveShotIds.value = meta.shotIds
  else gridActiveShotIds.value = []
  if (Array.isArray(meta.assignments)) gridAssignmentsState.value = meta.assignments
  else gridAssignmentsState.value = []
  gridRecoveredAt.value = meta.recoveredAt || meta.createdAtLabel || ''
  gridRecoveredMode.value = meta.recoveredMode || meta.modeLabel || ''
}

function selectGridHistory(item) {
  const cached = restoreGridState()
  const cachedEntry = cached?.entries?.[item.localPath] || {}
  applyGridState(item.localPath, {
    ...item,
    ...cachedEntry,
    generationId: cachedEntry.generationId || item.id,
    recoveredAt: cachedEntry.recoveredAt || item.createdAtLabel,
    recoveredMode: cachedEntry.recoveredMode || item.modeLabel,
  })
  if (!gridAssignmentsState.value.length) resetGridAssignments()
  persistGridImagePath(item.localPath)
}

function reopenGridPreview() {
  if (!gridImagePath.value) {
    openGridTool()
    return
  }
  gridDialog.value = true
  if (!gridAssignmentsState.value.length) resetGridAssignments()
  gridStep.value = 3
}

function parseGridLayoutFromFrameType(value) {
  const match = String(value || '').match(/grid_[^_]+_(\d+)x(\d+)$/)
  if (!match) return null
  return { rows: Number(match[1]) || 3, cols: Number(match[2]) || 3 }
}

function continueGridSplit() {
  if (!gridImagePath.value) {
    toast.warning(t('episode.grid.noGridToSplit'))
    return
  }
  if (!gridAssignmentsState.value.length) resetGridAssignments()
  gridDialog.value = true
  gridStep.value = 3
}

function getGridPromptShotIds() {
  if (gridMode.value === 'multi_ref') return gridSingleTarget.value ? [gridSingleTarget.value] : []
  if (gridMode.value === 'first_last') return [...gridSelected.value]
  return gridSelected.value.slice(0, gridTotalCells.value)
}

async function generateGridPrompt() {
  if (!gridCanStart.value) {
    toast.warning(t('episode.grid.pickShot'))
    return
  }
  gridPromptLoading.value = true
  gridPromptStatus.value = t('episode.grid.callingPrompt')
  gridPromptText.value = ''
  gridCellPrompts.value = []
  gridPromptSource.value = ''
  try {
    const shotIds = getGridPromptShotIds()
    const { rows, cols } = gridAutoLayout.value

    const res = await gridAPI.prompt({
      storyboard_ids: shotIds,
      drama_id: dramaId,
      episode_id: epId.value,
      rows,
      cols,
      mode: gridMode.value,
    })

    gridPromptText.value = res?.grid_prompt || ''
    gridCellPrompts.value = Array.isArray(res?.cell_prompts) ? res.cell_prompts : []
    gridPromptSource.value = res?.source || ''

    if (gridPromptText.value) {
      resetGridAssignments()
      gridPromptStatus.value = gridPromptSource.value === 'agent' ? t('episode.grid.agentPromptDone') : t('episode.grid.templatePromptDone')
      gridStep.value = 1
    } else {
      gridPromptStatus.value = ''
      toast.error(t('episode.grid.promptFailed'))
    }
  } catch (e) {
    gridPromptStatus.value = ''
    toast.error(e?.message || t('episode.grid.promptGenFailed'))
  } finally {
    gridPromptLoading.value = false
  }
}

async function startGridGen() {
  let rows, cols, ids
  if (gridMode.value === 'multi_ref') {
    rows = gridAutoLayout.value.rows; cols = gridAutoLayout.value.cols; ids = [gridSingleTarget.value]
  } else {
    rows = gridAutoLayout.value.rows; cols = gridAutoLayout.value.cols; ids = gridSelected.value.slice(0, gridTotalCells.value)
    if (gridMode.value === 'first_last') ids = [...gridSelected.value]
  }
  gridActiveShotIds.value = ids.filter(Boolean)
  gridActualLayout.value = { rows, cols }
  if (!gridAssignmentsState.value.length) resetGridAssignments()
  gridStep.value = 2
  gridStatusText.value = t('episode.grid.submitting')
  try {
    const res = await gridAPI.generate({
      storyboard_ids: ids,
      drama_id: dramaId,
      rows,
      cols,
      mode: gridMode.value,
      custom_prompt: gridPromptText.value || undefined,
    })
    gridGenId.value = res.image_generation_id
    gridActualLayout.value = res.grid || { rows, cols }
    gridStatusText.value = t('episode.grid.waitingImage')
    pollGridStatus()
  } catch (e) {
    toast.error(e.message)
    gridStep.value = 0
  }
}

async function pollGridStatus() {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await gridAPI.status(gridGenId.value)
      gridStatusText.value = t('episode.grid.statusLabel', { status: res.status })
      if (res.status === 'completed' && res.local_path) {
        gridImagePath.value = res.local_path
        gridGenId.value = gridGenId.value || res.id || null
        persistGridImagePath(res.local_path)
        gridStep.value = 3
        return
      }
      if (res.status === 'failed') {
        toast.error(res.error_msg || t('episode.grid.genFailed'))
        gridStep.value = 0
        return
      }
    } catch {}
  }
  toast.error(t('episode.grid.genTimeout')); gridStep.value = 0
}

async function loadLatestGridImage() {
  try {
    const rows = await imageAPI.list({ drama_id: dramaId })
    const list = Array.isArray(rows) ? rows : []
    const grids = list
      .filter((row) => row?.status === 'completed' && String(row?.frame_type || row?.frameType || '').startsWith('grid_') && (row?.local_path || row?.localPath))
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))
      .map((row) => {
        const frameType = String(row?.frame_type || row?.frameType || '')
        const parsedLayout = parseGridLayoutFromFrameType(frameType) || { rows: 3, cols: 3 }
        return {
          id: row.id,
          localPath: row?.local_path || row?.localPath || '',
          layout: parsedLayout,
          modeLabel: frameType.replace(/^grid_/, '').replace(/_/g, ' · '),
          createdAtLabel: row?.created_at || row?.createdAt || '',
        }
      })

    gridHistory.value = grids

    const cached = restoreGridState()
    const preferredPath = cached?.activeImagePath && grids.some(item => item.localPath === cached.activeImagePath)
      ? cached.activeImagePath
      : grids[0]?.localPath
    const current = grids.find(item => item.localPath === preferredPath)
    if (current) {
      const cachedEntry = cached?.entries?.[current.localPath] || {}
      applyGridState(current.localPath, {
        ...current,
        ...cachedEntry,
        generationId: cachedEntry.generationId || current.id,
        recoveredAt: cachedEntry.recoveredAt || current.createdAtLabel,
        recoveredMode: cachedEntry.recoveredMode || current.modeLabel,
      })
      if (!gridAssignmentsState.value.length) resetGridAssignments()
      persistGridImagePath(current.localPath)
      return
    }
  } catch {}

  const cached = restoreGridState()
  if (cached?.activeImagePath) {
    const cachedEntry = cached?.entries?.[cached.activeImagePath] || {}
    applyGridState(cached.activeImagePath, {
      ...cachedEntry,
      recoveredAt: cachedEntry.recoveredAt || '',
      recoveredMode: cachedEntry.recoveredMode || '',
    })
  }
}

async function doGridSplit() {
  const { rows, cols } = gridActualLayout.value
  try {
    const assignments = gridAssignments.value
      .filter(item => !!item.storyboard_id)
      .map(item => ({ storyboard_id: item.storyboard_id, frame_type: item.frame_type }))
    if (!assignments.length) {
      toast.warning(t('episode.grid.assignAtLeastOne'))
      return
    }
    await gridAPI.split({ image_generation_id: gridGenId.value, rows, cols, assignments })
    persistGridImagePath(gridImagePath.value)
    gridStep.value = 4
    toast.success(t('episode.grid.splitDone'))
  } catch (e) {
    toast.error(e.message)
  }
}

const charImgCount = computed(() => visualChars.value.filter(c => c.image_url || c.imageUrl).length)
const sceneImgCount = computed(() => scenes.value.filter(s => s.image_url || s.imageUrl).length)
const ttsEligibleCount = computed(() => sbs.value.filter(s => hasDialogue(s)).length)
const ttsGeneratedCount = computed(() => sbs.value.filter(s => hasDialogue(s) && hasTTS(s)).length)
const shotImgCount = computed(() => sbs.value.filter(s => s.first_frame_image || s.firstFrameImage || s.last_frame_image || s.lastFrameImage || s.composed_image || s.composedImage).length)
const shotVidCount = computed(() => sbs.value.filter(s => s.video_url || s.videoUrl).length)
const visualCharTotal = computed(() => visualChars.value.length)

const prodTabDefs = computed(() => [
  { id: 'chars', label: t('episode.prod.tabChars'), icon: Users, badge: visualCharTotal.value ? `${charImgCount.value}/${visualCharTotal.value}` : '' },
  { id: 'scenes', label: t('episode.prod.tabScenes'), icon: MapPin, badge: sceneImgCount.value ? `${sceneImgCount.value}/${scenes.value.length}` : '' },
  { id: 'shots', label: t('episode.prod.tabShots'), icon: ImageIcon, badge: shotImgCount.value ? `${shotImgCount.value}/${sbs.value.length}` : '' },
  { id: 'videos', label: t('episode.prod.tabVideos'), icon: Video, badge: shotVidCount.value ? `${shotVidCount.value}/${sbs.value.length}` : '' },
  { id: 'compose', label: t('episode.prod.tabCompose'), icon: Layers, badge: composedCount.value ? `${composedCount.value}/${sbs.value.length}` : '' },
])

const mainStageDefs = computed(() => [
  { id: 'script', label: t('episode.sidebar.mainScript'), desc: t('episode.sidebar.mainScriptDesc'), icon: FileText },
  { id: 'assets', label: t('episode.sidebar.mainAssets'), desc: t('episode.sidebar.mainAssetsDesc'), icon: FolderKanban },
  { id: 'storyboard', label: t('episode.sidebar.mainStoryboard'), desc: t('episode.sidebar.mainStoryboardDesc'), icon: Clapperboard },
  { id: 'export', label: t('episode.sidebar.mainExport'), desc: t('episode.sidebar.mainExportDesc'), icon: Download },
])

const sidebarSections = computed(() => ([
  {
    id: 'script',
    label: t('episode.sidebar.sectionScript'),
    items: [
      { key: 'script:raw', label: t('episode.script.stepRaw'), desc: '', icon: FileText, done: !!rawContent.value },
      { key: 'script:rewrite', label: t('episode.script.stepRewrite'), desc: '', icon: FileText, done: !!scriptContent.value },
      { key: 'script:extract', label: t('episode.script.stepExtract'), desc: '', icon: Users, done: !!chars.value.length },
      { key: 'script:voice', label: t('episode.script.stepVoice'), desc: '', icon: Mic2, done: !!chars.value.length && charsVoiced.value === chars.value.length },
      { key: 'script:storyboard', label: t('episode.script.stepStoryboard'), desc: '', icon: Clapperboard, done: !!sbs.value.length },
    ],
  },
  {
    id: 'production',
    label: t('episode.sidebar.sectionProduction'),
    items: [
      { key: 'prod:chars', label: t('episode.prod.tabChars'), desc: '', icon: Users, done: prodStepDone('chars') },
      { key: 'prod:scenes', label: t('episode.prod.tabScenes'), desc: '', icon: MapPin, done: prodStepDone('scenes') },
      { key: 'prod:shots', label: t('episode.prod.tabShots'), desc: '', icon: ImageIcon, done: prodStepDone('shots') },
      { key: 'prod:videos', label: t('episode.prod.tabVideos'), desc: '', icon: Video, done: prodStepDone('videos') },
      { key: 'prod:compose', label: t('episode.prod.tabCompose'), desc: '', icon: Layers, done: prodStepDone('compose') },
    ],
  },
  {
    id: 'export',
    label: t('episode.sidebar.sectionExport'),
    items: [
      { key: 'export:merge', label: t('episode.export.mergeExport'), desc: '', icon: Download, done: !!mergeUrl.value },
    ],
  },
]))

const activeMainStage = computed(() => {
  if (panel.value === 'export') return 'export'
  if (panel.value === 'production') {
    return ['chars', 'scenes'].includes(prodTab.value) ? 'assets' : 'storyboard'
  }
  if (scriptStep.value <= 1) return 'script'
  if (scriptStep.value <= 3) return 'assets'
  return 'storyboard'
})

function mainStageDone(stageId) {
  if (stageId === 'script') return !!scriptContent.value
  if (stageId === 'assets') {
    const charsReady = !!chars.value.length && charsVoiced.value === chars.value.length
    const charImagesReady = !visualCharTotal.value || charImgCount.value === visualCharTotal.value
    const sceneImagesReady = !scenes.value.length || sceneImgCount.value === scenes.value.length
    return charsReady && charImagesReady && sceneImagesReady
  }
  if (stageId === 'storyboard') {
    if (!sbs.value.length) return false
    return shotImgCount.value === sbs.value.length
      && shotVidCount.value === sbs.value.length
  }
  if (stageId === 'export') return !!mergeUrl.value
  return false
}

function goMainStage(stageId) {
  if (stageId === 'script') {
    panel.value = 'script'
    scriptStep.value = Math.min(scriptStep.value, 1)
    return
  }
  if (stageId === 'assets') {
    const hasAssetWorkspace = !!visualCharTotal.value || !!scenes.value.length
    const hasPendingAssetGeneration = (visualCharTotal.value && charImgCount.value < visualCharTotal.value)
      || (scenes.value.length && sceneImgCount.value < scenes.value.length)
    if (panel.value === 'production' || hasPendingAssetGeneration || hasAssetWorkspace) {
      panel.value = 'production'
      prodTab.value = ['chars', 'scenes'].includes(prodTab.value) ? prodTab.value : 'chars'
      return
    }
    panel.value = 'script'
    scriptStep.value = chars.value.length ? 3 : 2
    return
  }
  if (stageId === 'storyboard') {
    if (panel.value === 'production') {
      prodTab.value = ['shots', 'videos', 'compose'].includes(prodTab.value) ? prodTab.value : 'shots'
      return
    }
    panel.value = 'script'
    scriptStep.value = 4
    return
  }
  panel.value = 'export'
}

const activeSubSteps = computed(() => {
  if (activeMainStage.value === 'script') {
    return [
      { key: 'script:raw', label: t('episode.script.stepRaw'), done: !!rawContent.value },
      { key: 'script:rewrite', label: t('episode.script.stepRewrite'), done: !!scriptContent.value },
    ]
  }
  if (activeMainStage.value === 'assets') {
    return [
      { key: 'script:extract', label: t('episode.sidebar.extractChars'), done: !!chars.value.length },
      { key: 'script:voice', label: t('episode.voice.stepName'), done: !!chars.value.length && charsVoiced.value === chars.value.length },
      { key: 'prod:chars', label: t('episode.prod.tabChars'), done: !visualCharTotal.value || charImgCount.value === visualCharTotal.value },
      { key: 'prod:scenes', label: t('episode.prod.tabScenes'), done: !scenes.value.length || sceneImgCount.value === scenes.value.length },
    ]
  }
  if (activeMainStage.value === 'storyboard') {
    return [
      { key: 'script:storyboard', label: t('episode.sidebar.breakdown'), done: !!sbs.value.length },
      { key: 'prod:shots', label: t('episode.prod.tabShots'), done: !!sbs.value.length && shotImgCount.value === sbs.value.length },
      { key: 'prod:videos', label: t('episode.prod.tabVideos'), done: !!sbs.value.length && shotVidCount.value === sbs.value.length },
      { key: 'prod:compose', label: t('episode.prod.tabCompose'), done: !!sbs.value.length && composedCount.value === sbs.value.length },
    ]
  }
  return [
    { key: 'export:merge', label: t('episode.export.mergeExport'), done: !!mergeUrl.value },
  ]
})

const activeSubStepKey = computed(() => {
  if (panel.value === 'script') {
    if (scriptStep.value === 0) return 'script:raw'
    if (scriptStep.value === 1) return 'script:rewrite'
    if (scriptStep.value === 2) return 'script:extract'
    if (scriptStep.value === 3) return 'script:voice'
    return 'script:storyboard'
  }
  if (panel.value === 'production') return `prod:${prodTab.value}`
  return 'export:merge'
})

const sidebarJumpSteps = computed(() => {
  const section = sidebarSections.value.find((item) => item.items.some(step => step.key === activeSubStepKey.value))
  return section?.items || []
})

const bubbleSteps = computed(() => {
  if (panel.value === 'script') {
    return [
      { key: 'script:raw', label: stepLabels.value[0], done: !!rawContent.value },
      { key: 'script:rewrite', label: stepLabels.value[1], done: !!scriptContent.value },
      { key: 'script:extract', label: stepLabels.value[2], done: !!chars.value.length },
      { key: 'script:voice', label: stepLabels.value[3], done: !!chars.value.length && charsVoiced.value === chars.value.length },
      { key: 'script:storyboard', label: stepLabels.value[4], done: !!sbs.value.length },
    ]
  }
  if (panel.value === 'production') {
    return prodTabDefs.value.map(step => ({
      key: `prod:${step.id}`,
      label: step.label,
      done: prodStepDone(step.id),
    }))
  }
  return []
})

const activeBubbleKey = computed(() => {
  if (panel.value === 'script') return activeSubStepKey.value
  if (panel.value === 'production') return `prod:${prodTab.value}`
  return ''
})

const showBottomBubble = computed(() => panel.value === 'script' || panel.value === 'production')

function goSubStep(key) {
  if (key.startsWith('script:')) {
    panel.value = 'script'
    const stepMap = {
      'script:raw': 0,
      'script:rewrite': 1,
      'script:extract': 2,
      'script:voice': 3,
      'script:storyboard': 4,
    }
    scriptStep.value = stepMap[key] ?? 0
    return
  }
  if (key.startsWith('prod:')) {
    panel.value = 'production'
    prodTab.value = key.replace('prod:', '')
    return
  }
  panel.value = 'export'
}

const pipelineProgress = computed(() => {
  let p = 0
  if (rawContent.value) p++
  if (scriptContent.value) p++
  if (chars.value.length) p++
  if (charsVoiced.value) p++
  if (sbs.value.length) p++
  if (sbs.value.some(s => s.composed_image || s.composedImage)) p++
  if (sbs.value.some(s => s.video_url || s.videoUrl)) p++
  if (mergeUrl.value) p++
  return p
})

const currentStageLabel = computed(() => {
  if (panel.value === 'script') return t('episode.status.stageScript', { step: stepLabels.value[scriptStep.value] })
  if (panel.value === 'production') return t('episode.status.stageProduction', { tab: prodTabDefs.value[prodTabIdx.value]?.label || t('episode.status.production') })
  return mergeUrl.value ? t('episode.status.stageExportDone') : (mergeableVidCount.value >= MIN_MERGE_CLIPS ? t('episode.status.stageExportReady') : t('episode.status.stageExportWaiting'))
})

const currentMainStageLabel = computed(() => {
  const current = mainStageDefs.value.find(stage => stage.id === activeMainStage.value)
  return current?.label || t('episode.status.workspace')
})

const currentSubStageLabel = computed(() => {
  const current = activeSubSteps.value.find(step => step.key === activeSubStepKey.value)
  return current?.label || currentStageLabel.value
})

function updateCharVoice(charId, voiceId) {
  characterAPI.update(charId, { voice_style: voiceId, voice_provider: lockedAudioProvider.value || undefined })
  const c = chars.value.find(ch => ch.id === charId)
  if (c) {
    c.voice_style = voiceId
    c.voiceStyle = voiceId
    c.voice_provider = lockedAudioProvider.value || ''
    c.voiceProvider = lockedAudioProvider.value || ''
    c.voice_sample_url = ''
    c.voiceSampleUrl = ''
  }
}
function getVoiceProfile(voiceId) {
  return voiceProfiles.value.find(v => v.id === voiceId) || null
}
const totalDuration = computed(() => sbs.value.reduce((s, sb) => s + (sb.duration || 10), 0))

const selectedSb = ref(null)
const shotTypes = computed(() => [
  t('episode.shotTypes.extremeWide'), t('episode.shotTypes.wide'), t('episode.shotTypes.full'), t('episode.shotTypes.medium'), t('episode.shotTypes.mediumClose'), t('episode.shotTypes.close'), t('episode.shotTypes.closeup'), t('episode.shotTypes.extremeClose'),
  t('episode.shotTypes.twoShot'), t('episode.shotTypes.threeShot'), t('episode.shotTypes.group'), t('episode.shotTypes.back'), t('episode.shotTypes.side'), t('episode.shotTypes.front'), t('episode.shotTypes.highAngle'), t('episode.shotTypes.lowAngle'),
  t('episode.shotTypes.overShoulder'), t('episode.shotTypes.pov'), t('episode.shotTypes.aerial'), t('episode.shotTypes.moving'),
])
const shotAngles = computed(() => [t('episode.shotAngles.level'), t('episode.shotAngles.lowAngle'), t('episode.shotAngles.highAngle'), t('episode.shotAngles.side'), t('episode.shotAngles.back'), t('episode.shotAngles.oblique'), t('episode.shotAngles.pov'), t('episode.shotAngles.overShoulder')])
const shotMovements = computed(() => [t('episode.shotMovements.static'), t('episode.shotMovements.pushIn'), t('episode.shotMovements.pullOut'), t('episode.shotMovements.pan'), t('episode.shotMovements.track'), t('episode.shotMovements.follow'), t('episode.shotMovements.crane'), t('episode.shotMovements.handheld'), t('episode.shotMovements.orbit')])

// 历史数据中存的是中文枚举值，这里做显示层映射（不改动库里的值）
const SHOT_ZH = {
  types: ['大远景', '远景', '全景', '中景', '中近景', '近景', '特写', '大特写', '双人镜头', '三人镜头', '群像', '背影', '侧面', '正面', '俯视', '仰视', '过肩', '主观视角', '航拍', '运动镜头'],
  angles: ['平视', '仰视', '俯视', '侧拍', '背拍', '斜侧', '主观视角', '过肩'],
  movements: ['固定', '推镜', '拉镜', '摇镜', '移镜', '跟拍', '升降', '手持', '环绕'],
}

// 非标准枚举的额外别名（历史数据/LLM 生成中出现的变体写法）
const SHOT_ALIAS = { '中全景': 'episode.shotTypes.full' }

function mapShotEnum(raw, options, zhList) {
  if (!raw) return raw
  if (options.includes(raw)) return raw
  // 别名仅在英文模式下翻译；中文模式保持原始值
  if (SHOT_ALIAS[raw] && locale.value === 'en') return t(SHOT_ALIAS[raw])
  const i = zhList.indexOf(raw)
  return i >= 0 ? options[i] : raw
}

const shotTypeOf = (sb) => mapShotEnum(sb.shot_type || sb.shotType, shotTypes.value, SHOT_ZH.types)
const shotAngleOf = (sb) => mapShotEnum(sb.shot_angle || sb.shotAngle, shotAngles.value, SHOT_ZH.angles)
const shotMovementOf = (sb) => mapShotEnum(sb.shot_movement || sb.shotMovement, shotMovements.value, SHOT_ZH.movements)

function updateField(sb, field, value) {
  const current = sb[field] ?? sb[toCamel(field)]
  if (current === value) return
  sb[field] = value
  const camelField = toCamel(field)
  if (camelField !== field) sb[camelField] = value
  storyboardAPI.update(sb.id, { [field]: value })
}

function toCamel(field) {
  return field.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function getStoryboardCharacterIds(sb) {
  return sb?.character_ids || sb?.characterIds || []
}

function getStoryboardCharacterNames(sb) {
  const ids = getStoryboardCharacterIds(sb)
  return chars.value.filter(char => ids.includes(char.id)).map(char => char.name)
}

function isStoryboardCharacterSelected(sb, charId) {
  return getStoryboardCharacterIds(sb).includes(charId)
}

function toggleStoryboardCharacter(sb, charId) {
  const currentIds = getStoryboardCharacterIds(sb)
  const nextIds = currentIds.includes(charId)
    ? currentIds.filter(id => id !== charId)
    : [...currentIds, charId]
  updateField(sb, 'character_ids', nextIds)
}

function getSceneName(sb) {
  const sceneId = sb?.scene_id || sb?.sceneId
  if (!sceneId) return t('episode.storyboard.noScene')
  const scene = scenes.value.find(s => s.id === sceneId)
  return scene ? t('episode.storyboard.sceneTime', { location: scene.location, time: scene.time || t('episode.storyboard.noTime') }) : t('episode.storyboard.sceneNo', { n: sceneId })
}

async function deleteShot(sb) {
  if (!confirm(t('episode.storyboard.confirmDeleteShot'))) return
  const idx = sbs.value.indexOf(sb)
  await storyboardAPI.del(sb.id)
  await refresh()
  if (sbs.value.length) selectedSb.value = sbs.value[Math.min(idx, sbs.value.length - 1)]
  else selectedSb.value = null
}

const scriptSteps = computed(() => {
  const hasScript = !!scriptContent.value
  const hasChars = chars.value.length > 0 && hasScript
  const hasVoice = charsVoiced.value > 0 && hasChars
  const hasSbs = sbs.value.length > 0
  return [
    { label: stepLabels.value[0], state: rawContent.value ? 'done' : 'active', spinning: false },
    { label: stepLabels.value[1], state: hasScript ? 'done' : (rawContent.value ? 'active' : ''), spinning: rt.value === 'script_rewriter' },
    { label: stepLabels.value[2], state: hasChars ? 'done' : (hasScript ? 'active' : ''), spinning: rt.value === 'extractor' },
    { label: stepLabels.value[3], state: hasVoice ? 'done' : (hasChars ? 'active' : ''), spinning: rt.value === 'voice_assigner' },
    { label: stepLabels.value[4], state: hasSbs ? 'done' : (hasVoice ? 'active' : ''), spinning: rt.value === 'storyboard_breaker' },
  ]
})

watch(rawContent, v => { localRaw.value = v }, { immediate: true })
watch(scriptContent, v => { localScript.value = v }, { immediate: true })

// syncScriptStep: 是否按当前完成度自动定位剧本步骤。
// 仅首次进入（及切换集重新初始化）时为 true；轮询与操作后刷新必须为 false，
// 否则会把用户手动切换的「原始内容/AI 改写/提取/音色」强行弹回分镜。
async function refresh(options) {
  const syncScriptStep = (options && options.syncScriptStep) === true
  try {
    drama.value = await dramaAPI.get(dramaId)
    const ep = drama.value.episodes?.find(e => (e.episode_number || e.episodeNumber) === episodeNumber)
    if (ep) {
      episode.value = ep
      try { chars.value = await episodeAPI.characters(ep.id) } catch { chars.value = [] }
      try { scenes.value = await episodeAPI.scenes(ep.id) } catch { scenes.value = [] }
      sbs.value = await episodeAPI.storyboards(ep.id)
      if (sbs.value.length && !selectedSb.value) selectedSb.value = sbs.value[0]

      if (syncScriptStep) {
        const epHasContent = !!(episode.value?.content)
        const epHasScript = !!(episode.value?.script_content || episode.value?.scriptContent)
        const epHasSbs = sbs.value.length > 0

        if (epHasSbs) scriptStep.value = 4
        else if (epHasScript && chars.value.some(c => c.voice_style || c.voiceStyle)) scriptStep.value = 3
        else if (epHasScript && chars.value.length) scriptStep.value = 2
        else if (epHasScript || epHasContent) scriptStep.value = 1
        else scriptStep.value = 0
      }
      await loadLatestGridImage()
    }
  } catch (e) {
    toast.error(e.message)
  }
  try { mergeData.value = await mergeAPI.status(epId.value) } catch {}
  await syncVideoTasks()
  await refreshCredits()
}

async function syncVideoTasks() {
  if (!dramaId) return
  try {
    const gens = await videoAPI.list({ drama_id: dramaId })
    const items = Array.isArray(gens) ? gens : []
    for (const g of items) {
      const sbId = g.storyboard_id ?? g.storyboardId
      if (!sbId) continue
      if (g.status === 'processing') {
        // 该镜头已有轮询在跑则跳过。否则每次 refresh -> syncVideoTasks 都会新起一个
        // 120 轮循环，而循环内又会 refresh，导致轮询数量指数级放大。
        if (pendingVideoIds.value.includes(sbId)) continue
        pendingVideoIds.value.push(sbId)
        pollVideoGeneration(g.id, sbId)
      } else if (g.status === 'failed') {
        pendingVideoIds.value = pendingVideoIds.value.filter(id => id !== sbId)
        failedVideoMessages.value = {
          ...failedVideoMessages.value,
          [sbId]: g.error_msg || g.errorMsg || t('episode.videos.genFailed'),
        }
      }
    }
  } catch {}
}

function saveRaw() { episodeAPI.update(epId.value, { content: localRaw.value }); episode.value.content = localRaw.value }
function saveScr() { episodeAPI.update(epId.value, { script_content: localScript.value }); episode.value.script_content = localScript.value }
function doRewrite() { saveRaw(); runAgent('script_rewriter', '请读取原始内容，按内置短剧改即梦标准完成短剧化改写，输出格式化剧本并保存', dramaId, epId.value, refresh) }
function skipRewrite() {
  const raw = (localRaw.value || rawContent.value || '').trim()
  if (!raw) {
    toast.warning(t('episode.script.needRaw'))
    return
  }
  localScript.value = raw
  saveScr()
  toast.success(t('episode.script.skippedRewrite'))
  scriptStep.value = 2
}
function doExtract() { saveScr(); runAgent('extractor', '请从剧本中提取所有角色和场景信息，提取时自动与项目已有数据进行去重合并', dramaId, epId.value, refresh) }
function doVoice() { runAgent('voice_assigner', '请为所有角色分配合适的音色', dramaId, epId.value, refresh) }
async function batchGenSamples() {
  const pending = chars.value.filter(c => (c.voice_style || c.voiceStyle) && !(c.voice_sample_url || c.voiceSampleUrl))
  if (!pending.length) {
    toast.info(charsVoiced.value ? t('episode.voice.allSamplesDone') : t('episode.voice.needAssign'))
    return
  }
  const results = await Promise.allSettled(pending.map(c => characterAPI.voiceSample(c.id, epId.value)))
  const okCount = results.filter(r => r.status === 'fulfilled').length
  const failCount = results.length - okCount
  if (okCount) toast.success(t('episode.voice.samplesGenerated', { n: okCount }))
  if (failCount) toast.error(t('episode.voice.samplesFailed', { n: failCount }))
  await refresh()
}
function doBreakdown() {
  runAgent(
    'storyboard_breaker',
    `请拆解分镜并生成视频提示词。当前集视频方案：${lockedVideoConfigLabel.value}，请按该方案的时长与风格限制生成合适的视频提示词。`,
    dramaId,
    epId.value,
    refresh,
  )
}
async function genSample(id) { try { await characterAPI.voiceSample(id, epId.value); toast.success(t('episode.voice.sampleGenerated')); refresh() } catch (e) { toast.error(e.message) } }
async function addShot() { await storyboardAPI.create({ episode_id: epId.value, storyboard_number: sbs.value.length + 1, title: t('episode.storyboard.defaultShotTitle', { n: sbs.value.length + 1 }), duration: 10 }); refresh() }

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 轮询刷新：每 delay 毫秒整体刷新一次，每张图/视频一旦后端写回就立刻显示；
// 一直刷到全部完成（check 为真）或达到上限。上限放宽到约 7.5 分钟，避免慢速出图时提前停止导致“生成好了却不显示、要手动刷新”。
function watchAsyncResult(check, attempts = 180, delay = 2500) {
  void (async () => {
    for (let i = 0; i < attempts; i++) {
      await sleep(delay)
      await refresh()
      if (check()) return
    }
  })()
}

async function genCharImg(id) {
  const char = chars.value.find(c => c.id === id)
  const previousUrl = char?.image_url || char?.imageUrl || ''
  const isRegenerate = !!previousUrl

  try {
    if (!isPendingCharImage(id)) pendingCharImageIds.value.push(id)
    await characterAPI.generateImage(id, epId.value)
    toast.success(isRegenerate ? t('episode.chars.imageRegenerating') : t('episode.chars.imageGenerating'))
    await refresh()
    watchAsyncResult(() => {
      const updated = chars.value.find(c => c.id === id)
      const url = updated?.image_url || updated?.imageUrl || ''
      const done = isRegenerate ? (!!url && url !== previousUrl) : !!url
      if (done) pendingCharImageIds.value = pendingCharImageIds.value.filter(item => item !== id)
      return done
    })
  } catch (e) {
    pendingCharImageIds.value = pendingCharImageIds.value.filter(item => item !== id)
    toast.error(e.message)
  }
}
function batchCharImages() {
  const ids = visualChars.value.filter(c => !(c.image_url || c.imageUrl)).map(c => c.id)
  if (!ids.length) { toast.info(t('episode.chars.allImagesDone')); return }
  pendingCharImageIds.value = [...new Set([...pendingCharImageIds.value, ...ids])]
  characterAPI.batchImages(ids, epId.value).then(async () => {
    toast.success(t('episode.chars.batchGenerating'))
    await refresh()
    watchAsyncResult(() => ids.every(id => {
      const char = chars.value.find(c => c.id === id)
      const done = !!(char?.image_url || char?.imageUrl)
      if (done) pendingCharImageIds.value = pendingCharImageIds.value.filter(item => item !== id)
      return done
    }), 180)
  }).catch(e => {
    pendingCharImageIds.value = pendingCharImageIds.value.filter(item => !ids.includes(item))
    toast.error(e.message)
  })
}
async function genSceneImg(id) {
  try {
    if (!isPendingSceneImage(id)) pendingSceneImageIds.value.push(id)
    await sceneAPI.generateImage(id, epId.value)
    toast.success(t('episode.scenes.imageGenerating'))
    await refresh()
    watchAsyncResult(() => {
      const scene = scenes.value.find(s => s.id === id)
      const done = !!(scene?.image_url || scene?.imageUrl)
      if (done) pendingSceneImageIds.value = pendingSceneImageIds.value.filter(item => item !== id)
      return done
    })
  } catch (e) {
    pendingSceneImageIds.value = pendingSceneImageIds.value.filter(item => item !== id)
    toast.error(e.message)
  }
}

function pickSceneUpload(id) {
  sceneUploadTargetId.value = id
  const input = sceneUploadInput.value
  if (!input) return
  input.value = ''
  input.click()
}

async function onSceneFilePicked(event) {
  const file = event.target?.files?.[0]
  const id = sceneUploadTargetId.value
  sceneUploadTargetId.value = null
  if (!file || id == null) return

  if (!file.type.startsWith('image/')) {
    toast.error(t('episode.scenes.pickImageFile'))
    return
  }

  try {
    if (!isPendingSceneUpload(id)) pendingSceneUploadIds.value.push(id)
    await sceneAPI.uploadImage(id, file)
    toast.success(t('episode.scenes.uploaded'))
    await refresh()
  } catch (e) {
    toast.error(e.message || t('episode.scenes.uploadFailed'))
  } finally {
    pendingSceneUploadIds.value = pendingSceneUploadIds.value.filter(item => item !== id)
    if (sceneUploadInput.value) sceneUploadInput.value.value = ''
  }
}
function batchSceneImages() {
  const ids = scenes.value.filter(s => !(s.image_url || s.imageUrl)).map(s => s.id)
  if (!ids.length) { toast.info(t('episode.scenes.allImagesDone')); return }
  pendingSceneImageIds.value = [...new Set([...pendingSceneImageIds.value, ...ids])]
  ids.forEach(id => { sceneAPI.generateImage(id, epId.value).then(() => refresh()).catch(e => toast.error(e.message)) })
  toast.success(t('episode.scenes.batchGenerating'))
  watchAsyncResult(() => ids.every(id => {
    const scene = scenes.value.find(s => s.id === id)
    const done = !!(scene?.image_url || scene?.imageUrl)
    if (done) pendingSceneImageIds.value = pendingSceneImageIds.value.filter(item => item !== id)
    return done
  }), 180)
}

const IGNORE_TTS_SPEAKERS = /^(环境音|环境声|音效|效果音|sfx|sound ?effect|bgm|背景音|背景音乐|ambient)$/i
const IGNORE_TTS_TEXT = /^(无|无对白|无台词|无旁白|无需配音|无需对白|none|null|n\/a|na|环境音|环境声|音效|效果音|纯音效|纯环境音|只有环境音|仅环境音|背景音|背景音乐|bgm|sfx|ambient)$/i

function getDialogueSpeakerRaw(sb) {
  const dialogue = sb?.dialogue?.trim() || ''
  const match = dialogue.match(/^(.+?)[:：]/)
  return match ? match[1].replace(/[（(].+?[)）]/g, '').trim() : ''
}

function getDialogueText(sb) {
  const dialogue = sb?.dialogue?.trim() || ''
  return dialogue ? dialogue.replace(/^.+?[:：]\s*/, '').trim() : ''
}

function isTTSIgnorable(sb) {
  const speaker = getDialogueSpeakerRaw(sb)
  const text = getDialogueText(sb)
  if (!sb?.dialogue?.trim()) return true
  if (speaker && IGNORE_TTS_SPEAKERS.test(speaker)) return true
  if (!text) return true
  if (IGNORE_TTS_TEXT.test(text)) return true
  return false
}

function hasDialogue(sb) { return !isTTSIgnorable(sb) }
function hasTTS(sb) { return !!(sb?.tts_audio_url || sb?.ttsAudioUrl) }
function getTTSUrl(sb) { return sb?.tts_audio_url || sb?.ttsAudioUrl || '' }
function getDialogueSpeaker(sb) {
  const speaker = getDialogueSpeakerRaw(sb)
  if (!speaker) return t('episode.compose.narrator')
  return speaker
}
async function genShotTTS(sb) {
  try {
    await storyboardAPI.generateTTS(sb.id)
    toast.success(t('episode.compose.shotDubGenerated', { n: sb.storyboard_number || sb.storyboardNumber || sb.id }))
    await refresh()
  } catch (e) { toast.error(e.message) }
}
async function batchShotTTS() {
  const pending = sbs.value.filter(sb => hasDialogue(sb) && !hasTTS(sb))
  if (!pending.length) {
    toast.info(ttsEligibleCount.value ? t('episode.compose.allDubsDone') : t('episode.compose.noDialogue'))
    return
  }
  const results = await Promise.allSettled(pending.map(sb => storyboardAPI.generateTTS(sb.id)))
  const okCount = results.filter(r => r.status === 'fulfilled').length
  const failCount = results.length - okCount
  if (okCount) toast.success(t('episode.compose.dubsGenerated', { n: okCount }))
  if (failCount) toast.error(t('episode.compose.dubsFailed', { n: failCount }))
  await refresh()
}

function getFirstFrame(s) { return s?.first_frame_image || s?.firstFrameImage || null }
function getLastFrame(s) { return s?.last_frame_image || s?.lastFrameImage || null }
function getStoryboardCover(s) { return s?.composed_image || s?.composedImage || getFirstFrame(s) || getLastFrame(s) || null }
function getVideoUrl(s) { return s?.video_url || s?.videoUrl || null }
function getComposedVideoUrl(s) { return s?.composed_video_url || s?.composedVideoUrl || null }
function hasImg(s) { return !!getStoryboardCover(s) }
function hasVid(s) { return !!getVideoUrl(s) }
function hasComposed(s) { return !!getComposedVideoUrl(s) }

function getShotReferenceImages(sb) {
  const refs = []
  const pushRef = (value) => {
    if (!value || refs.includes(value) || refs.length >= 6) return
    refs.push(value)
  }
  const sceneId = sb?.scene_id || sb?.sceneId
  const scene = scenes.value.find(item => item.id === sceneId)
  pushRef(scene?.image_url || scene?.imageUrl)
  for (const charId of getStoryboardCharacterIds(sb)) {
    const char = chars.value.find(item => item.id === charId)
    pushRef(char?.image_url || char?.imageUrl)
  }
  for (const ref of getRefs(sb)) {
    pushRef(ref)
  }
  const first = getFirstFrame(sb)
  const last = getLastFrame(sb)
  pushRef(first)
  pushRef(last)
  return refs.filter(Boolean).slice(0, 6)
}

function buildShotImagePrompt(sb, frameType) {
  const title = sb.title || ''
  const description = sb.image_prompt || sb.imagePrompt || sb.description || ''
  const shotType = sb.shot_type || sb.shotType || ''
  const angle = sb.angle || ''
  const movement = sb.movement || ''
  const location = sb.location || getSceneName(sb)
  const time = sb.time || ''
  const charactersText = getStoryboardCharacterNames(sb).join('、')
  const action = sb.action || ''
  const atmosphere = sb.atmosphere || ''
  const frameHint = frameType === 'first_frame'
    ? '生成这个镜头的起始关键帧，突出建立关系和动作开始瞬间'
    : '生成这个镜头的结束关键帧，突出动作结束、情绪落点或结果状态'

  return [
    title ? `镜头标题：${title}` : '',
    description ? `画面描述：${description}` : '',
    shotType ? `景别：${shotType}` : '',
    angle ? `机位：${angle}` : '',
    movement ? `运镜：${movement}` : '',
    charactersText ? `角色：${charactersText}` : '',
    location ? `地点：${location}` : '',
    time ? `时间：${time}` : '',
    action ? `动作：${action}` : '',
    atmosphere ? `氛围：${atmosphere}` : '',
    frameHint,
  ].filter(Boolean).join('；')
}

async function genShotFrame(sb, frameType) {
  const prompt = buildShotImagePrompt(sb, frameType)
  const referenceImages = getShotReferenceImages(sb)
  const key = framePendingKey(sb.id, frameType)
  try {
    if (!pendingShotFrameKeys.value.includes(key)) pendingShotFrameKeys.value.push(key)
    const body = {
      storyboard_id: sb.id,
      drama_id: dramaId,
      prompt,
      frame_type: frameType,
      reference_images: referenceImages.length ? referenceImages : undefined,
    }
    await imageAPI.generate(body)
    toast.success(frameType === 'first_frame' ? t('episode.shots.firstFrameGenerating') : t('episode.shots.lastFrameGenerating'))
    await refresh()
    watchAsyncResult(() => {
      const target = sbs.value.find(s => s.id === sb.id)
      const done = frameType === 'first_frame' ? !!getFirstFrame(target) : !!getLastFrame(target)
      if (done) pendingShotFrameKeys.value = pendingShotFrameKeys.value.filter(item => item !== key)
      return done
    })
  } catch (e) {
    pendingShotFrameKeys.value = pendingShotFrameKeys.value.filter(item => item !== key)
    toast.error(e.message)
  }
}

function videoPriceLabel(sb) {
  if (isPendingVideo(sb.id) || hasVid(sb)) return ''
  return formatVideoButtonCredits(Number(sb.duration || 5))
}

async function genVid(sb) {
  const params = {
    storyboard_id: sb.id,
    drama_id: dramaId,
    prompt: sb.video_prompt || sb.videoPrompt || '',
    duration: Number(sb.duration || 5),
  }
  const first = getFirstFrame(sb)
  const last = getLastFrame(sb)
  const refs = getRefs(sb)
  if (first && last) { Object.assign(params, { reference_mode: 'first_last', first_frame_url: first, last_frame_url: last }) }
  else if (refs.length) { Object.assign(params, { reference_mode: 'multiple', reference_image_urls: [first, ...refs].filter(Boolean) }) }
  else if (first) { Object.assign(params, { reference_mode: 'single', image_url: first }) }
  try {
    delete failedVideoMessages.value[sb.id]
    if (!isPendingVideo(sb.id)) pendingVideoIds.value.push(sb.id)
    const generation = await videoAPI.generate(params)
    toast.success(t('episode.videos.videoGenerating'))
    await refresh()
    pollVideoGeneration(generation?.id, sb.id)
  } catch (e) {
    pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== sb.id)
    toast.error(e.message)
  }
}
async function pollVideoGeneration(generationId, storyboardId) {
  if (!generationId) {
    watchAsyncResult(() => {
      const target = sbs.value.find(s => s.id === storyboardId)
      const done = !!(target?.video_url || target?.videoUrl)
      if (done) pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== storyboardId)
      return done
    }, 60, 4000)
    return
  }
  for (let i = 0; i < 120; i++) {
    await sleep(4000)
    try {
      const res = await videoAPI.get(generationId)
      await refresh()
      if (res?.status === 'completed') {
        pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== storyboardId)
        delete failedVideoMessages.value[storyboardId]
        toast.success(t('episode.videos.genDone'))
        return
      }
      if (res?.status === 'failed') {
        pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== storyboardId)
        failedVideoMessages.value = {
          ...failedVideoMessages.value,
          [storyboardId]: res?.error_msg || res?.errorMsg || t('episode.videos.genFailed'),
        }
        toast.error(failedVideoMessages.value[storyboardId])
        return
      }
    } catch {}
  }
  pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== storyboardId)
  failedVideoMessages.value = {
    ...failedVideoMessages.value,
    [storyboardId]: t('episode.videos.genTimeout'),
  }
  toast.error(t('episode.videos.genTimeout'))
}
async function doCompose(sb) {
  try {
    delete failedComposeMessages.value[sb.id]
    if (!isPendingCompose(sb.id)) pendingComposeIds.value.push(sb.id)
    await composeAPI.shot(sb.id)
    toast.success(t('episode.compose.done'))
    pendingComposeIds.value = pendingComposeIds.value.filter(item => item !== sb.id)
    refresh()
  } catch (e) {
    pendingComposeIds.value = pendingComposeIds.value.filter(item => item !== sb.id)
    failedComposeMessages.value = {
      ...failedComposeMessages.value,
      [sb.id]: e.message,
    }
    toast.error(e.message)
  }
}
function batchVideos() {
  const pendingIds = sbs.value.filter(s => !hasVid(s)).map(s => s.id)
  pendingIds.forEach(id => {
    const sb = sbs.value.find(item => item.id === id)
    if (sb) genVid(sb)
  })
  if (pendingIds.length) {
    pendingVideoIds.value = [...new Set([...pendingVideoIds.value, ...pendingIds])]
    watchAsyncResult(() => pendingIds.every(id => {
      const target = sbs.value.find(s => s.id === id)
      const done = !!(target?.video_url || target?.videoUrl)
      if (done) pendingVideoIds.value = pendingVideoIds.value.filter(item => item !== id)
      return done
    }), 80, 4000)
  }
}
async function batchCompose() {
  await composeAPI.all(epId.value)
  pendingComposeIds.value = [...new Set(sbs.value.filter(sb => !!sb.video_url || !!sb.videoUrl).map(sb => sb.id))]
  toast.success(t('episode.compose.batchStarted'))
  pollComposeStatus()
}
const exportVideoEl = ref(null)
const downloadingMerge = ref(false)

function fullscreenMerged() {
  const el = exportVideoEl.value
  if (!el) return
  if (el.requestFullscreen) el.requestFullscreen()
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
  else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen() // iOS Safari
}

async function downloadMerged() {
  if (!mergeUrl.value) return
  const url = staticUrl(mergeUrl.value)
  const safeTitle = (drama.value?.title || t('episode.export.defaultTitle')).replace(/[\\/:*?"<>|]/g, '')
  const filename = t('episode.export.filename', { title: safeTitle, n: episodeNumber })
  try {
    downloadingMerge.value = true
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('HTTP ' + resp.status)
    const blob = await resp.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000)
    toast.success(t('episode.export.downloadStarted', { name: filename }))
  } catch (e) {
    window.open(url, '_blank') // 回退：新标签打开，可右键另存为
    toast.error(t('episode.export.downloadFallback'))
  } finally {
    downloadingMerge.value = false
  }
}

async function doMerge() {
  if (mergeableVidCount.value < MIN_MERGE_CLIPS) {
    toast.warning(t('episode.export.needMinClips', { min: MIN_MERGE_CLIPS }))
    return
  }
  merging.value = true
  try {
    await mergeAPI.merge(epId.value)
    toast.success(t('episode.export.merging'))
    const poll = setInterval(async () => {
      try { mergeData.value = await mergeAPI.status(epId.value) } catch {}
      if (mergeData.value?.status === 'completed' || mergeData.value?.status === 'failed') {
        clearInterval(poll)
        merging.value = false
        if (mergeData.value.status === 'completed') {
          toast.success(t('episode.export.mergeDone'))
          await refresh()
        } else {
          toast.error(mergeData.value?.error_msg || mergeData.value?.errorMsg || t('episode.export.mergeFailed'))
        }
      }
    }, 3000)
  } catch (e) {
    merging.value = false
    toast.error(e.message)
  }
}

async function pollComposeStatus() {
  for (let i = 0; i < 120; i++) {
    await sleep(3000)
    try {
      const res = await composeAPI.status(epId.value)
      await refresh()
      const items = Array.isArray(res?.items) ? res.items : []
      const processingIds = items.filter(item => item.status === 'compose_processing').map(item => item.id)
      pendingComposeIds.value = processingIds

      const failedItems = items.filter(item => item.status === 'compose_failed')
      if (failedItems.length) {
        const next = { ...failedComposeMessages.value }
        failedItems.forEach((item) => {
          next[item.id] = item.error_msg || item.errorMsg || t('episode.compose.failed')
        })
        failedComposeMessages.value = next
      }

      if (!processingIds.length) {
        if (failedItems.length) toast.error(t('episode.compose.someFailed', { n: failedItems.length }))
        else toast.success(t('episode.compose.batchDone'))
        return
      }
    } catch {}
  }
}
function getRefs(sb) {
  const raw = sb.reference_images || sb.referenceImages
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

async function loadConfigs() {
  try {
    const [imgCfgs, vidCfgs, audCfgs] = await Promise.all([
      aiConfigAPI.list('image'),
      aiConfigAPI.list('video'),
      aiConfigAPI.list('audio'),
    ])
    imageConfigs.value = imgCfgs || []
    videoConfigs.value = vidCfgs || []
    audioConfigs.value = audCfgs || []
  } catch (e) { console.error('Failed to load AI configs', e) }
}

function inferVoiceGender(name, desc = []) {
  const text = `${name} ${Array.isArray(desc) ? desc.join(' ') : ''}`
  if (/[男|青年|大爷|学长|boy|man|male]/i.test(text)) return 'male'
  if (/[女|少女|御姐|奶奶|girl|woman|female]/i.test(text)) return 'female'
  return 'neutral'
}

function mapVoiceProfile(v) {
  const desc = Array.isArray(v.description) ? v.description : []
  return {
    id: v.voice_id,
    label: v.voice_name || v.voice_id,
    gender: inferVoiceGender(v.voice_name || v.voice_id, desc),
    traits: desc.length ? desc.slice(0, 2).join('、') : t('episode.voice.defaultTraits', { lang: v.language || t('episode.voice.multilingual') }),
    suitable: desc.length > 2 ? desc.slice(2).join('、') : t('episode.voice.defaultSuitable', { lang: v.language || t('episode.voice.general') }),
  }
}

async function loadVoices() {
  try {
    const provider = lockedAudioProvider.value || 'minimax'
    const rows = await voicesAPI.list(provider)
    rawVoiceProfiles.value = rows
  } catch (e) {
    console.error('Failed to load voices', e)
    rawVoiceProfiles.value = null
  }
}

watch([lockedAudioConfigId, audioConfigs], () => { loadVoices() }, { deep: true })
onMounted(() => { refresh({ syncScriptStep: true }); loadConfigs(); loadVoices() })
</script>

<style scoped>
/* ===== Studio Layout ===== */
.studio {
  --progress-gradient: linear-gradient(90deg, var(--cyan), var(--accent));
  --media-overlay: color-mix(in srgb, var(--bg-base) 82%, transparent);
  --dialog-backdrop: rgba(0, 0, 0, 0.72);
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding: 14px;
  gap: 12px;
  background: var(--page-background);
  color: var(--text-0);
  color-scheme: dark;
}
.card {
  min-width: 0;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--surface-gradient);
  box-shadow: var(--shadow-sm);
}
.studio :is(button, a, input, textarea, select):focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: -2px;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--dialog-backdrop);
  backdrop-filter: blur(10px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.animate-spin { color: var(--cyan); }
.studio .input,
.studio .textarea {
  min-width: 0;
  background: var(--bg-input);
  border-color: var(--border-strong);
  color: var(--text-0);
}
.studio :is(input, textarea)::placeholder { color: var(--text-3); }

.studio-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(16px);
}

.studio-topbar-main,
.sidebar,
.main {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}

.studio-topbar-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 0;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  background: transparent;
  min-width: 0;
}

.back-btn.topbar-back {
  width: auto;
  min-width: 100px;
  padding: 0 12px;
  height: 36px;
  gap: 6px;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 14px;
}

.studio-identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.studio-overline {
  display: none;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
}

.studio-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.studio-title {
  min-width: 0;
  max-width: 100%;
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.02em;
  white-space: normal;
  overflow-wrap: anywhere;
}

.studio-episode-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent-text);
  font-size: 11px;
  font-weight: 700;
}

.studio-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.studio-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.studio-meta-pill.is-stage {
  background: var(--accent-bg);
  color: var(--accent-text);
}
.studio-meta-pill.is-progress {
  background: var(--cyan-bg);
  color: var(--cyan);
}
.studio-meta-inline {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  white-space: nowrap;
}

.studio-topbar-side {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.studio-actions {
  display: flex;
  gap: 6px;
}
.studio-topbar .btn {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  white-space: nowrap;
}

.studio-body {
  display: grid;
  grid-template-columns: 244px minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  flex: 1;
}

/* ===== Sidebar ===== */
.sidebar {
  width: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  border-radius: 20px;
}
.back-btn {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-strong); border-radius: 14px;
  background: var(--bg-2); color: var(--text-2);
  cursor: pointer; transition: all 0.15s;
  box-shadow: var(--shadow-xs);
}
.back-btn:hover { background: var(--bg-hover); color: var(--text-0); }

/* Pipeline Nav */
.pipeline { flex: 1; overflow-y: auto; padding: 16px 14px 12px; display: flex; flex-direction: column; gap: 12px; }
.pipe-section { display: flex; flex-direction: column; gap: 4px; }
.pipe-section-label {
  font-size: 10px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.1em;
  padding: 2px 8px 3px;
}
.pipe-item {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px;
  padding: 7px 10px;
  border-radius: 17px;
  font-size: 12px; font-weight: 600;
  background: none; border: 1px solid transparent; color: var(--text-2); cursor: pointer;
  transition: all 0.14s; width: 100%; text-align: left;
}
.pipe-item:hover { background: var(--bg-hover); color: var(--text-0); }
.pipe-item.active {
  background: var(--cyan-bg);
  color: var(--cyan);
  border-color: var(--cyan);
  box-shadow: var(--shadow-xs);
}
.pipe-item.done:not(.active) { color: var(--success); }
.pipe-item-sub {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  padding: 7px 10px;
  position: relative;
  min-height: 42px;
}

.pipe-item-sub:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 18px;
  top: 25px;
  bottom: -7px;
  width: 1px;
  background: var(--border);
}

.pipe-icon {
  width: 17px; height: 17px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border: 1px solid var(--border);
  color: var(--text-3); flex-shrink: 0; transition: all 0.15s;
  position: relative;
  z-index: 1;
}
.pipe-item.done .pipe-icon { background: var(--success-bg); border-color: var(--success); color: var(--success); }
.pipe-item.active .pipe-icon { background: var(--cyan-bg); border-color: var(--cyan); color: var(--cyan); }

.pipe-label { flex: 1; font-size: 12px; }
.pipe-copy { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.pipe-sub {
  font-size: 10.5px;
  line-height: 1.35;
  color: var(--text-3);
  font-weight: 500;
}
.pipe-badge {
  font-size: 11px; font-weight: 700; padding: 1px 5px;
  border-radius: 99px; background: var(--bg-3); color: var(--text-3);
  font-family: var(--font-mono);
}
.pipe-badge.badge-done { background: var(--success-bg); color: var(--success); }
.pipe-spinner { width: 10px; height: 10px; border: 1.5px solid var(--cyan-bg); border-top-color: var(--cyan); border-radius: 50%; animation: spin 0.8s linear infinite; }

/* Sidebar Bottom */
.sidebar-bottom {
  padding: 12px 14px 14px;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
  flex-shrink: 0;
  background: var(--surface-gradient);
}
.sidebar-jumper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 3px 0 2px;
}
.sidebar-jump-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: var(--bg-3);
  cursor: pointer;
  transition: transform 0.14s, background 0.14s, box-shadow 0.14s;
}
.sidebar-jump-dot:hover {
  transform: scale(1.08);
}
.sidebar-jump-dot.active {
  background: var(--cyan);
  box-shadow: 0 0 0 2px var(--cyan-bg);
}
.sidebar-jump-dot.done {
  background: var(--success);
}
.sidebar-jump-dot.active.done {
  background: var(--cyan);
}
.progress-wrap { display: flex; flex-direction: column; gap: 5px; }
.progress-head { display: flex; justify-content: space-between; }
.progress-label { font-size: 10.5px; color: var(--text-3); font-weight: 500; }
.progress-val { font-size: 10.5px; color: var(--text-2); font-family: var(--font-mono); font-weight: 600; }
.progress-track { height: 6px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--progress-gradient); border-radius: 99px; transition: width 0.5s var(--ease-out); }
.refresh-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; font-size: 12px; color: var(--text-2);
  background: var(--bg-2); border: 1px solid var(--border); border-radius: 999px;
  cursor: pointer; transition: all 0.15s;
}
.refresh-btn:hover { background: var(--bg-hover); color: var(--text-0); }

/* ===== Main Content ===== */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; min-height: 0; border-radius: 20px; }
.content-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; min-height: 0; }
.stage-subnav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-gradient);
  overflow-x: auto;
  flex-shrink: 0;
}
.stage-subnav-item {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}
.stage-subnav-item:hover {
  background: var(--bg-hover);
  color: var(--text-0);
}
.stage-subnav-item.active {
  background: var(--cyan-bg);
  border-color: var(--cyan);
  color: var(--cyan);
}
.stage-subnav-item.done:not(.active) {
  color: var(--text-1);
}
.stage-subnav-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 0 4px var(--success-bg);
}

/* Toolbar */
.step-toolbar {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-bottom: 1px solid var(--border);
  background: var(--surface-gradient); flex-shrink: 0;
}
.prod-toolbar { background: var(--surface-gradient); }
.toolbar-left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.step-indicator { display: flex; align-items: center; gap: 8px; }
.step-num {
  width: 26px; height: 26px; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--accent-bg);
  font-family: var(--font-mono); font-size: 10px; font-weight: 800; color: var(--accent-text); letter-spacing: 0.05em;
}
.step-name { font-size: 13px; font-weight: 700; color: var(--text-1); font-family: var(--font-display); }
.char-count { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); }

/* Editor Area */
.step-editor { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.fill-textarea {
  flex: 1; border: none; border-radius: 0; padding: 26px 28px;
  font-size: 13.5px; line-height: 1.9; resize: none; outline: none;
  font-family: var(--font-body); background: var(--bg-input); color: var(--text-0);
}
.fill-textarea:focus { box-shadow: inset 0 0 0 1px var(--cyan); }

/* Step Empty State */
.step-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; min-height: 300px; gap: 10px; padding: 46px;
  animation: fadeIn 0.3s var(--ease-out);
}
.empty-visual {
  width: 72px; height: 72px; border-radius: 20px;
  background: var(--accent-bg); color: var(--accent-text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.empty-title { font-size: 22px; font-weight: 700; font-family: var(--font-display); color: var(--text-0); }
.empty-desc { font-size: 13px; color: var(--text-2); max-width: 420px; text-align: center; line-height: 1.8; }
.step-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

/* Step Loading */
.step-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; gap: 12px; min-height: 240px; padding: 32px;
  color: var(--cyan); text-align: center;
}
.loading-text { font-size: 13px; color: var(--text-2); }

/* Step Navigator Bubble */
.step-bubble {
  position: static;
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px 12px;
  background: var(--surface-gradient);
  border-top: 1px solid var(--border);
  margin-top: auto;
}
.bubble-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.bubble-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-0); }
.bubble-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.bubble-btn.primary { margin-left: auto; background: var(--accent); color: var(--text-0); box-shadow: var(--shadow-sm); border-color: transparent; }
.bubble-btn.primary:hover:not(:disabled) { background: var(--accent-dark); }
.bubble-btn.primary:disabled { box-shadow: none; opacity: 0.5; }
.bubble-btn.regen { margin-left: auto; }
.bubble-btn.regen + .bubble-btn.primary { margin-left: 8px; }
.bubble-dots { display: flex; gap: 7px; padding: 0 4px; }
.bubble-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--bg-3); cursor: pointer; transition: all 0.15s;
  border: none;
}
.bubble-dot.done { background: var(--success); }
.bubble-dot.current { background: var(--cyan); transform: scale(1.2); box-shadow: 0 0 0 2px var(--cyan-bg); }

/* Extract grid */
.extract-stage { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px; display: grid; grid-template-columns: 280px minmax(0, 1fr) minmax(0, 1fr); gap: 12px; align-items: stretch; }
.extract-summary { padding: 16px; display: flex; flex-direction: column; gap: 14px; align-self: stretch; position: sticky; top: 0; max-height: 100%; overflow-y: auto; }
.extract-summary-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3); }
.extract-summary-title { font-size: 20px; line-height: 1.05; font-family: var(--font-display); color: var(--text-0); }
.extract-summary-desc { font-size: 12px; color: var(--text-2); line-height: 1.7; }
.extract-summary-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.extract-summary-stat { padding: 10px 12px; border-radius: 16px; background: var(--cyan-bg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.extract-summary-stat span { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }
.extract-summary-stat strong { font-size: 18px; color: var(--text-0); font-family: var(--font-display); }
.extract-summary-note { padding: 10px 12px; border-radius: 16px; background: var(--bg-1); border: 1px solid var(--border); font-size: 11px; line-height: 1.7; color: var(--text-2); }
.extract-card { overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.extract-card-head {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; font-size: 12px; font-weight: 600;
  border-bottom: 1px solid var(--border); background: var(--bg-1);
  color: var(--text-1);
}
.extract-list { padding: 8px 14px; flex: 1; min-height: 0; overflow-y: auto; }
.extract-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.extract-row + .extract-row { border-top: 1px solid var(--border); }
.char-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--accent-bg); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.scene-icon {
  width: 30px; height: 30px; border-radius: 6px;
  background: var(--bg-2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3); flex-shrink: 0;
}
.extract-info { min-width: 0; }
.extract-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.extract-name { font-size: 13px; font-weight: 600; }
.extract-meta { font-size: 11px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.extract-meta.wrap { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* Voice grid */
.voice-stage { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px; display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 12px; }
.voice-stage-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-self: start;
  position: sticky;
  top: 0;
  min-height: 0;
  max-height: calc(100vh - 210px);
  overflow: hidden;
}
.voice-stage-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3); }
.voice-stage-title { font-size: 20px; line-height: 1.05; font-family: var(--font-display); color: var(--text-0); }
.voice-stage-desc { font-size: 12px; color: var(--text-2); line-height: 1.7; }
.voice-stage-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.voice-stage-stat { padding: 10px 12px; border-radius: 16px; background: var(--cyan-bg); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; }
.voice-stage-stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }
.voice-stage-stat strong { font-size: 18px; color: var(--text-0); font-family: var(--font-display); }
.voice-library-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}
.voice-library {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}
.voice-library-item { padding: 10px 12px; border-radius: 16px; background: var(--bg-1); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.voice-library-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.voice-library-name { font-size: 13px; font-weight: 700; color: var(--text-0); }
.voice-library-traits { font-size: 11px; color: var(--text-1); }
.voice-library-fit { font-size: 10px; color: var(--text-3); line-height: 1.5; }

.voice-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 12px; align-content: start; }
.voice-card { padding: 16px; display: flex; flex-direction: column; gap: 12px; border-radius: 20px; min-height: 0; }
.voice-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.voice-char { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.voice-name { min-width: 0; flex: 1; }
.voice-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.voice-card-copy { min-height: 58px; }
.voice-card-text { font-size: 12px; line-height: 1.7; color: var(--text-2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.voice-select-block { display: flex; flex-direction: column; gap: 6px; }
.voice-block-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }
.voice-profile-card { padding: 12px; border-radius: 16px; background: var(--surface-gradient); border: 1px solid var(--border-strong); display: flex; flex-direction: column; gap: 4px; }
.voice-profile-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.voice-profile-name { font-size: 13px; font-weight: 700; color: var(--accent-text); }
.voice-profile-traits { font-size: 11px; color: var(--text-1); }
.voice-profile-fit { font-size: 10px; color: var(--text-2); line-height: 1.5; }
.voice-actions-row { display: flex; align-items: center; gap: 8px; }
.voice-player audio { width: 100%; height: 30px; border-radius: 16px; }
.char-avatar.lg { width: 38px; height: 38px; font-size: 16px; }

/* Split layout (storyboard) */
.split-layout { flex: 1; display: flex; min-height: 0; overflow: hidden; }
.shot-list { width: 296px; flex-shrink: 0; overflow-y: auto; border-right: 1px solid var(--border); background: var(--bg-0); }
.shot-list-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 12px 10px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
  backdrop-filter: blur(10px);
}
.shot-list-title { font-size: 13px; font-weight: 700; color: var(--text-0); }
.shot-list-sub { margin-top: 3px; font-size: 11px; color: var(--text-3); line-height: 1.45; }
.shot-list-body { padding: 6px; }
.shot-item {
  position: relative; padding: 10px 11px; cursor: pointer;
  border: 1px solid transparent; border-left: 3px solid transparent;
  transition: all 0.15s;
  display: flex; flex-direction: column; gap: 5px;
  border-radius: 14px;
}
.shot-item + .shot-item { margin-top: 6px; }
.shot-item:hover { background: var(--bg-hover); border-color: var(--border); }
.shot-item.active {
  background: var(--cyan-bg);
  border-color: var(--border-strong);
  border-left-color: var(--cyan);
  box-shadow: var(--shadow-xs);
  z-index: 1;
}
.shot-item-header { display: flex; align-items: center; gap: 8px; }
.shot-num {
  font-size: 11px; font-family: var(--font-mono); font-weight: 700;
  color: var(--accent); background: var(--accent-bg);
  padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
  letter-spacing: 0.03em;
}
.shot-item.active .shot-num { background: var(--cyan); color: var(--bg-base); }
.shot-status { display: flex; gap: 4px; margin-left: auto; flex-shrink: 0; }
.shot-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--bg-3); flex-shrink: 0; }
.shot-dot.has-img { background: var(--success); }
.shot-dot.has-video { background: var(--info); }
.shot-dot.has-dialogue { background: var(--warning); }
.shot-body { }
.shot-desc { font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-1); }
.shot-item.active .shot-desc { color: var(--text-0); }
.shot-meta { display: flex; align-items: center; gap: 6px; }
.shot-location {
  font-size: 10px;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shot-dialogue {
  font-size: 10px; color: var(--text-3); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-left: 2px; border-left: 2px solid var(--border);
  padding-left: 6px;
}

.detail-panel { flex: 1; display: flex; flex-direction: column; overflow-y: auto; min-width: 0; }
.detail-head { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.detail-head-copy { display: flex; flex-direction: column; gap: 2px; }
.detail-head-title { font-size: 14px; font-weight: 700; color: var(--text-0); }
.detail-head-sub { font-size: 11px; color: var(--text-3); }
.detail-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.9fr);
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  background: var(--surface-gradient);
  border: 1px solid var(--border);
}
.detail-hero-copy { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.detail-hero-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-3);
}
.detail-hero-text { font-size: 13px; color: var(--text-1); line-height: 1.7; }
.detail-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.detail-preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.detail-preview-card { display: flex; flex-direction: column; gap: 6px; }
.detail-preview-title { font-size: 11px; font-weight: 700; color: var(--text-2); }
.detail-preview-media {
  position: relative; aspect-ratio: 16/9; overflow: hidden;
  border-radius: 16px; background: var(--bg-input);
  border: 1px solid var(--border);
}
.detail-preview-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.detail-preview-empty {
  width: 100%; height: 100%; min-height: 120px; display: flex; align-items: center; justify-content: center;
  color: var(--text-3); font-size: 12px;
}
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--bg-1);
  border: 1px solid var(--border);
}
.detail-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-section-title { font-size: 12px; font-weight: 700; color: var(--text-0); }
.detail-section-copy { font-size: 11px; color: var(--text-3); }

/* Field */
.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-1); }
.field-row { display: flex; gap: 12px; }
.field-grid { display: grid; gap: 12px; }
.field-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.field-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.locked-config {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--accent-bg);
  border: 1px solid var(--border-strong);
  color: var(--text-1);
  font-size: 11px;
  font-weight: 600;
}
.locked-config-banner {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-2);
}
.role-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.role-pill {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.role-pill:hover { border-color: var(--accent); color: var(--text-0); }
.role-pill.active {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--text-0);
  box-shadow: var(--shadow-sm);
}

/* Production tabs */
.prod-tabs { display: flex; gap: 2px; min-width: 0; max-width: 100%; overflow-x: auto; background: var(--bg-2); border-radius: 16px; padding: 3px; }
.prod-tab {
  flex-shrink: 0; white-space: nowrap;
  display: flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 12px;
  border: none; background: transparent; color: var(--text-2); cursor: pointer;
  border-radius: 12px; transition: all 0.15s; font-weight: 500;
}
.prod-tab:hover { color: var(--text-0); }
.prod-tab.active { background: var(--cyan-bg); color: var(--cyan); font-weight: 600; box-shadow: var(--shadow-xs); }
.prod-tab-badge { font-size: 10px; font-family: var(--font-mono); padding: 0 4px; background: var(--bg-3); border-radius: 99px; }
.prod-tab.active .prod-tab-badge { background: var(--cyan-bg); color: var(--cyan); }

/* Production content */
.prod-content { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.prod-section-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.dub-grid { display: flex; flex-direction: column; gap: 10px; }
.dub-card { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; border-radius: 20px; background: var(--surface-gradient); }
.dub-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.dub-copy { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.dub-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dub-desc { font-size: 13px; line-height: 1.6; color: var(--text-1); }
.dub-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 11px; }
.dub-foot { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border); }
.dub-audio { flex: 1; min-width: 0; height: 30px; }

/* Asset grid */
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.asset-card {
  display: flex; flex-direction: column; overflow: hidden;
  transition: transform 0.18s var(--ease-out), box-shadow 0.18s var(--ease-out), border-color 0.18s var(--ease-out);
}
.asset-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.asset-cover { position: relative; aspect-ratio: 1; background: var(--bg-2); overflow: hidden; }
.asset-cover.wide { aspect-ratio: 16/9; }
.asset-cover img { width: 100%; height: 100%; object-fit: cover; }
.previewable-image { cursor: zoom-in; transition: transform 0.18s var(--ease-out); }
.previewable-image:hover { transform: scale(1.015); }
.asset-cover-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--media-overlay);
  color: var(--text-0);
  font-size: 10px;
  font-weight: 700;
}
.asset-cover-badge.is-ready {
  background: var(--bg-base);
  color: var(--success);
  border: 1px solid var(--success);
}
.asset-cover-badge.is-pending {
  background: var(--bg-base);
  color: var(--cyan);
  border: 1px solid var(--cyan);
}
.asset-cover-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-3); }
.asset-body { padding: 8px 10px; }
.asset-name { font-size: 13px; font-weight: 600; }
.asset-meta { font-size: 11px; }
.asset-foot { display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-top: 1px solid var(--border); }
.asset-foot-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
.hidden-file-input { display: none; }

/* Frame grid */
.frame-grid { display: flex; flex-direction: column; gap: 8px; }
.frame-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 14px; cursor: pointer;
  border-radius: 18px;
  transition: all 0.15s;
  border: 1.5px solid transparent;
}
.frame-row:hover { background: var(--bg-0); border-color: var(--border); }
.frame-row.active {
  background: var(--cyan-bg);
  border-color: var(--cyan);
  box-shadow: var(--shadow-sm);
}
.frame-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.frame-top { display: flex; align-items: center; gap: 8px; }
.frame-num {
  font-size: 13px; font-family: var(--font-mono); font-weight: 800;
  color: var(--accent);
}
.frame-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px;
  border-radius: 20px;
  background: var(--accent-bg); color: var(--accent);
  border: 1px solid var(--border-strong);
  white-space: nowrap;
}
.frame-desc {
  font-size: 12px; line-height: 1.5; color: var(--text-1);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.frame-meta { display: flex; align-items: center; gap: 6px; }
.frame-thumbs { display: flex; gap: 8px; flex-shrink: 0; }
.frame-thumb-wrap { display: flex; flex-direction: column; gap: 3px; align-items: center; }
.frame-thumb-label { font-size: 10px; font-weight: 600; color: var(--text-3); }
.frame-thumb {
  position: relative; width: 130px; aspect-ratio: 16/9;
  border-radius: 16px; overflow: hidden;
  background: var(--bg-2); cursor: pointer;
  transition: all 0.15s; border: 1.5px solid var(--border);
}
.frame-thumb:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); }
.frame-thumb img { width: 100%; height: 100%; object-fit: cover; }
.frame-thumb-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-3); }
.frame-re {
  position: absolute; top: 3px; right: 3px; width: 18px; height: 18px;
  border-radius: 50%; background: var(--media-overlay); color: var(--text-0);
  display: none; align-items: center; justify-content: center;
}
.frame-thumb:hover .frame-re { display: flex; }
.frame-scroll { flex: 1; overflow-y: auto; padding: 10px 12px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--bg-3); flex-shrink: 0; }
.dot.ok { background: var(--success); }
.dot.pending {
  background: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-bg);
}

/* Prod grid */
.prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.prod-card {
  display: flex; flex-direction: column; overflow: hidden;
  transition: transform 0.18s var(--ease-out), box-shadow 0.18s var(--ease-out), border-color 0.18s var(--ease-out);
  border-radius: 20px;
  background: var(--surface-gradient);
}
.prod-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.prod-cover { position: relative; aspect-ratio: 16/9; background: var(--bg-2); overflow: hidden; }
.prod-cover img { width: 100%; height: 100%; object-fit: cover; }
.prod-video { width: 100%; height: 100%; object-fit: cover; background: var(--bg-base); display: block; }
.prod-cover-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-3); }
.prod-idx {
  position: absolute; top: 5px; left: 5px; font-size: 10px; font-weight: 700;
  font-family: var(--font-mono); background: var(--media-overlay); color: var(--text-0); padding: 1px 5px; border-radius: 3px;
}
.prod-overlay-badge {
  position: absolute; bottom: 5px; right: 5px; font-size: 10px; font-weight: 600;
  background: var(--success); color: var(--bg-base); padding: 1px 5px; border-radius: 3px;
}
.prod-info { padding: 10px 12px 8px; }
.prod-desc { font-size: 12px; line-height: 1.4; }
.prod-meta-line { margin-top: 5px; font-size: 10px; color: var(--text-3); }
.prod-dots { display: flex; align-items: center; gap: 4px; margin-top: 5px; color: var(--text-3); }
.prod-error {
  margin-top: 6px;
  padding: 8px 10px;
  border: 1px solid var(--error);
  border-radius: 12px;
  background: var(--error-bg);
  font-size: 11px;
  line-height: 1.6;
  color: var(--error);
  overflow-wrap: anywhere;
}
.prod-price-hint {
  margin-top: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--gold);
}
.prod-price-hint::before {
  content: '实付 ';
  color: var(--text-3);
}
.prod-actions { display: flex; gap: 6px; padding: 8px 10px 10px; border-top: 1px solid var(--border); }
.prod-actions .btn { flex: 1; justify-content: center; flex-wrap: wrap; }
.btn-credit {
  font-size: 11px;
  font-weight: 600;
  color: var(--gold);
  opacity: 1;
  margin-left: 4px;
  white-space: nowrap;
}
:is(.btn-primary, .bubble-btn.primary) .btn-credit { color: var(--gold-hi); opacity: 1; }
.btn-credit.is-free { color: var(--success); opacity: 1; }
.frame-thumb-credit {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--gold);
  font-weight: 500;
}

/* Image viewer */
.image-viewer-overlay {
  z-index: 120;
  padding: 28px;
  background: var(--dialog-backdrop);
  backdrop-filter: blur(10px);
}
.image-viewer-dialog {
  width: min(1100px, calc(100vw - 56px));
  max-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: var(--surface-gradient);
}
.image-viewer-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}
.image-viewer-title {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
  font-family: var(--font-display);
}
.image-viewer-body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
  min-height: 0;
}
.image-viewer-img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 140px);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  background: var(--bg-input);
}

/* Grid tool dialog */
.grid-tool { width: min(1320px, calc(100vw - 40px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; overflow: hidden; animation: scaleIn 0.2s var(--ease-out); }
.grid-tool-head { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.grid-tool-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.grid-tool-body-preview { overflow-y: auto; min-height: 0; padding-bottom: 10px; }
.grid-tool-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex-shrink: 0; padding-top: 12px; border-top: 1px solid var(--border); margin-top: 4px; }
.grid-preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(340px, 400px);
  gap: 14px;
  min-height: 0;
  flex: 0 0 auto;
  align-items: start;
}
.grid-preview-pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.grid-assignment-pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--bg-1);
  overflow: hidden;
  max-height: min(70vh, 840px);
}
.grid-assign-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-gradient);
}
.grid-assign-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-0);
  font-family: var(--font-display);
}
.grid-assign-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-3);
}
.grid-assign-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-2);
}
.grid-assign-columns {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 112px minmax(0, 1fr);
  gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-2);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Prompt preview */
.grid-prompt-summary { background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px; padding: 12px 14px; }
.grid-prompt-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
.grid-prompt-text { font-size: 12px; color: var(--text-1); line-height: 1.7; }

.grid-blank-preview {
  display: grid;
  gap: 4px;
  border: 1.5px dashed var(--border-strong);
  border-radius: 16px;
  padding: 8px;
  min-height: 200px;
}
.grid-blank-cell {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 70px;
}
.grid-blank-cell.empty { opacity: 0.4; }
.grid-blank-cell-index { font-size: 10px; font-weight: 700; color: var(--accent); font-family: var(--font-mono); }
.grid-blank-cell-desc { font-size: 11px; color: var(--text-2); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.grid-mode-tabs { display: flex; gap: 6px; }
.grid-mode-tab { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 16px; background: var(--bg-0); color: var(--text-1); cursor: pointer; transition: all 0.15s; text-align: left; }
.grid-mode-tab:hover { border-color: var(--border-strong); }
.grid-mode-tab.active { border-color: var(--cyan); background: var(--cyan-bg); color: var(--cyan); }
.grid-config { display: flex; gap: 12px; align-items: flex-end; }
.grid-pick-list { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow-y: auto; border: 1px solid var(--border); border-radius: 16px; padding: 4px; }
.grid-pick-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.1s; }
.grid-pick-item:hover { background: var(--bg-hover); }
.grid-pick-item.selected { background: var(--cyan-bg); }
.grid-pick-item input { accent-color: var(--cyan); }
.grid-preview-wrap {
  border-radius: 16px;
  overflow: auto;
  border: 1px solid var(--border);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: min(70vh, 860px);
  padding: 10px;
}
.grid-preview-stage {
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin: auto;
  line-height: 0;
}
.grid-preview-img {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: min(66vh, 820px);
  object-fit: contain;
}
.grid-overlay { position: absolute; inset: 0; display: grid; }
.grid-overlay-cell {
  border: 1px dashed var(--text-2);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 4px 6px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.grid-overlay-cell.active {
  background: var(--cyan-bg);
  border-color: var(--cyan);
  box-shadow: inset 0 0 0 1px var(--cyan);
}
.grid-cell-label { font-size: 10px; font-weight: 700; color: var(--text-0); background: var(--media-overlay); padding: 1px 5px; border-radius: 3px; }
.grid-adjust-summary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 0 2px; }
.grid-assign-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 4px 12px 10px;
}
.grid-assign-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 112px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border);
}
.grid-assign-row.active {
  background: var(--cyan-bg);
  border-radius: 12px;
  padding-left: 6px;
  padding-right: 6px;
}
.grid-assign-row:last-child { border-bottom: 0; }
.grid-assign-index {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-3);
  font-family: var(--font-mono);
}
.grid-assign-bind {
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.45;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-history-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-gradient);
}
.grid-history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.grid-history-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-0);
  font-family: var(--font-display);
}
.grid-history-subtitle {
  font-size: 11px;
  color: var(--text-3);
}
.grid-history-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(160px, 182px);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.grid-history-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--bg-1);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.grid-history-item:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.grid-history-item.active {
  border-color: var(--cyan);
  background: var(--cyan-bg);
  box-shadow: var(--shadow-md);
}
.grid-history-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-input);
}
.grid-history-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.grid-history-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.grid-history-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.grid-history-meta {
  font-size: 10.5px;
  color: var(--text-3);
  line-height: 1.45;
  word-break: break-word;
}

.latest-grid-strip {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface-gradient);
}
.latest-grid-strip-thumb {
  width: 72px;
  height: 48px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-input);
  cursor: zoom-in;
  box-shadow: none;
}
.latest-grid-strip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.latest-grid-strip-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.latest-grid-strip-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.latest-grid-strip-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-0);
  font-family: var(--font-display);
}
.latest-grid-strip-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 10px;
  color: var(--text-3);
}
.latest-grid-strip-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Export */
.export-split { flex: 1; display: flex; min-height: 0; }
.export-main { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: safe center; padding: 32px; }
.export-video { max-width: 720px; width: 100%; border-radius: 18px; background: var(--bg-base); }
.export-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 16px; width: 100%; max-width: 720px; }
.export-list { width: 240px; flex-shrink: 0; border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.export-list-head { padding: 11px 14px; font-size: 11px; font-weight: 700; color: var(--text-3); border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.06em; }
.export-list-body { flex: 1; overflow-y: auto; padding: 6px; }
.exp-row { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 16px; }
.exp-row:hover { background: var(--bg-hover); }

/* Shared */
.dim { color: var(--text-3); }

@media (max-width: 1440px) {
  .studio-topbar { flex-wrap: wrap; }
  .studio-topbar-side { margin-left: auto; }
  .extract-stage { grid-template-columns: 240px minmax(0, 1fr) minmax(0, 1fr); }
  .voice-stage { grid-template-columns: 240px minmax(0, 1fr); }
  .voice-grid { grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); }
  .detail-hero { grid-template-columns: 1fr; }
  .field-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .step-toolbar { flex-wrap: wrap; }
}

@media (max-width: 1240px) {
  .studio { overflow-y: auto; }
  .studio-body { display: flex; flex-direction: column; flex: 0 0 auto; }
  .studio-topbar { flex-direction: column; align-items: stretch; }
  .studio-topbar-side { justify-content: space-between; margin-left: 0; flex-wrap: wrap; }
  .sidebar { flex-shrink: 0; }
  .pipeline { flex-direction: row; overflow-x: auto; padding: 10px; gap: 14px; }
  .pipe-section { flex: 0 0 auto; flex-direction: row; align-items: center; }
  .pipe-section-label { padding: 0 6px; white-space: nowrap; }
  .pipe-item { width: auto; flex-shrink: 0; }
  .pipe-item-sub:not(:last-child)::after { content: none; }
  .sidebar-bottom { flex-direction: row; align-items: center; flex-wrap: wrap; padding: 10px 14px; }
  .progress-wrap { flex: 1; min-width: 120px; }
  .refresh-btn { width: auto; padding: 8px 12px; }
  .main { min-height: 580px; overflow: visible; flex: 0 0 auto; }
  .content-panel { overflow: visible; }
  .step-editor { min-height: 480px; }
  .fill-textarea { min-height: 400px; }
  .extract-stage { overflow: visible; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .extract-summary { position: static; grid-column: 1 / -1; max-height: none; }
  .extract-card { min-height: 260px; }
  .extract-list { max-height: 480px; }
  .voice-stage { overflow: visible; }
  .voice-stage-panel { position: static; max-height: 680px; }
  .split-layout, .export-split { flex-direction: column; overflow: visible; }
  .shot-list { width: 100%; max-height: 260px; border-right: 0; border-bottom: 1px solid var(--border); }
  .detail-panel { min-height: 420px; overflow: visible; }
  .prod-content, .frame-scroll { overflow: visible; }
  .export-list { width: 100%; border-left: 0; border-top: 1px solid var(--border); }
  .export-list-body { max-height: 300px; }
  .image-viewer-overlay { padding: 16px; }
  .image-viewer-dialog { width: calc(100vw - 32px); max-height: calc(100dvh - 32px); }
  .grid-tool { width: calc(100vw - 24px); max-height: calc(100dvh - 24px); }
  .grid-preview-layout { grid-template-columns: 1fr; flex: 0 0 auto; }
  .grid-preview-wrap, .grid-preview-img { max-height: 42dvh; }
  .grid-preview-wrap { min-height: 180px; }
  .grid-assignment-pane { max-height: 480px; }
  .grid-assign-columns, .grid-assign-row { grid-template-columns: 42px minmax(0, 1fr) 112px minmax(0, 1fr); }
}

@media (max-width: 860px) {
  .studio { padding: 12px; gap: 12px; }
  .studio-topbar-main { align-items: center; }
  .studio-identity { flex-basis: 100%; }
  .studio-topbar-side, .studio-actions { flex-wrap: wrap; }
  .step-toolbar { align-items: flex-start; }
  .toolbar-left { min-width: 0; }
  .toolbar-right { width: 100%; justify-content: flex-start; }
  .prod-tabs { width: 100%; }
  .step-bubble, .export-bar, .voice-actions-row { flex-wrap: wrap; }
  .extract-stage, .voice-stage, .voice-grid { grid-template-columns: 1fr; }
  .asset-grid, .prod-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .voice-stage-panel { max-height: none; overflow: visible; }
  .voice-library { max-height: 320px; }
  .frame-row { flex-direction: column; align-items: stretch; }
  .frame-thumbs { width: 100%; }
  .frame-thumb-wrap { flex: 1; min-width: 0; }
  .frame-thumb { width: 100%; }
  .latest-grid-strip { grid-template-columns: 72px minmax(0, 1fr); }
  .latest-grid-strip-actions { grid-column: 1 / -1; justify-content: flex-end; }
  .grid-history-list { grid-auto-columns: minmax(148px, 168px); }
  .export-main { min-width: 0; padding: 20px; }
  .grid-mode-tabs, .grid-config, .grid-tool-foot, .grid-assign-pagination { flex-wrap: wrap; }
  .grid-mode-tab { min-width: 150px; }
  .grid-tool-head, .grid-tool-body { padding: 12px; }
  .grid-assign-columns, .grid-assign-row { grid-template-columns: 36px minmax(0, 1fr) 92px; }
  .grid-assign-columns span:last-child { grid-column: 2 / -1; }
  .grid-assign-bind { grid-column: 2 / -1; white-space: normal; overflow-wrap: anywhere; }
  .image-viewer-head { padding: 12px; }
  .image-viewer-body { padding: 12px; }
}

@media (max-width: 540px) {
  .studio { padding: 8px; gap: 8px; }
  .studio-topbar { padding: 10px; }
  .studio-topbar-side { gap: 8px; }
  .studio-actions { width: 100%; }
  .studio-actions .btn { flex: 1; justify-content: center; }
  .main { min-height: 520px; }
  .stage-subnav { gap: 6px; padding: 8px; }
  .step-toolbar { padding: 10px; }
  .step-indicator { flex-wrap: wrap; }
  .toolbar-right { gap: 6px; }
  .fill-textarea { padding: 16px; font-size: 16px; }
  .step-empty { min-height: 280px; padding: 28px 16px; }
  .empty-title { font-size: 20px; text-align: center; }
  .step-bubble { padding: 10px; gap: 8px; }
  .bubble-dots { width: 100%; justify-content: center; order: -1; }
  .bubble-btn { min-height: 40px; padding: 8px 10px; white-space: normal; justify-content: center; }
  .bubble-btn.regen { margin-left: 0; }
  .bubble-btn.regen + .bubble-btn.primary { margin-left: auto; }
  .prod-content, .voice-stage, .extract-stage, .detail-body { padding: 10px; }
  .asset-grid, .prod-grid, .field-grid-2, .field-grid-4 { grid-template-columns: 1fr; }
  .prod-section-bar > .ml-auto { margin-left: 0; width: 100%; flex-wrap: wrap; }
  .detail-head { flex-wrap: wrap; }
  .detail-head-copy { min-width: 0; flex: 1; }
  .detail-head-sub { overflow-wrap: anywhere; }
  .detail-preview-grid { grid-template-columns: 1fr; }
  .detail-preview-empty { min-height: 100px; }
  .asset-foot { flex-wrap: wrap; gap: 6px; }
  .asset-foot-actions { width: 100%; justify-content: flex-start; }
  .grid-tool-foot > .btn { flex: 1; min-width: 120px; justify-content: center; }
  .grid-tool-foot > .ml-auto { margin-left: 0; }
  .grid-blank-preview { overflow-x: auto; }
  .grid-blank-cell { min-width: 112px; }
  .grid-assign-columns, .grid-assign-row { grid-template-columns: 32px minmax(0, 1fr); }
  .grid-assign-columns span:nth-child(3), .grid-assign-row > :nth-child(3) { grid-column: 2; }
  .grid-assign-row { padding: 10px 0; }
  .grid-assign-bind { grid-column: 2; }
  .image-viewer-overlay { padding: 8px; }
  .image-viewer-dialog { width: calc(100vw - 16px); max-height: calc(100dvh - 16px); }
  .export-main { padding: 12px; }
  .export-bar { gap: 8px; }
  .export-bar .btn { flex: 1; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .studio *, .studio *::before, .studio *::after { transition-duration: 0.01ms; animation-duration: 0.01ms; animation-iteration-count: 1; }
}
</style>
