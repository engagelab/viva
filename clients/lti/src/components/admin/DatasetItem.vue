<template>
  <div>Dataset Details</div>
  <template>
    <div class="flex-container" style="background: #f1ece8">
      <div style="margin: 20px">
        <div style="padding-right: 90%">
          <img />
          <h2 style="padding-left: 35%; font-size: 20px">Administrasjon.</h2>
        </div>
      </div>
      <div class="layout">
        <div>
          <div
            class="labels"
            style="padding-bottom: 10px; padding-left: 30px"
          ></div>
          <label class="labels" style="padding-left: 30px">{{
            $t('name-description-heading')
          }}</label>
        </div>
        <div class="md-layout" style="padding-left: 80px">
          <div class="md-layout">
            <textarea
              :disabled="!edit"
              style="
                width: 300px;
                border-radius: 5px;
                border: 1px solid lightgrey;
                margin: 5px;
                :height50px ;
              "
              :placeholder="$t('name-prompt')"
              v-model.trim="datasett.navn"
              onpaste="return false;"
              @keypress="restrict($event)"
            ></textarea>
            <label class="labels" style="font-size: 10px">{{
              $t('name-limitation')
            }}</label>
            <div>
              <p class="smallLabels">
                {{ $t('data-manager') }}:
                <input v-model="datasett.users.owner" :disabled="true" />
              </p>
              <div class="smallLabels">
                {{ $t('admin-group') }}:
                <select
                  :disabled="!edit"
                  span
                  v-model="datasett.accessGroupId"
                  class="select"
                >
                  <option
                    v-for="(group, index) in dataportenGroups"
                    :value="group.id"
                    :key="index"
                  >
                    {{ group.displayName }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="md-layout">
          <div style="padding-left: 80px">
            <textarea
              :disabled="!edit"
              style="
                width: 525px;
                border-radius: 5px;
                border: 1px solid lightgrey;
                margin: 5px;
              "
              :placeholder="$t('description-prompt')"
              v-model="datasett.description"
            ></textarea>
          </div>
        </div>
        <div>
          <label class="labels" style="padding-left: 30px">{{
            $t('data-subjects-heading')
          }}</label>
          <div style="padding-left: 85px">
            <select
              :disabled="!edit"
              span
              ref="selects"
              @change="onChange()"
              class="select"
              style="width: 150px"
              placeholder
            >
              <option :value="0">{{ $t('add-subject') }}</option>
              <option
                v-for="(utvalg, index) in utvalgerSet"
                :value="utvalg"
                :key="index"
              >
                {{ utvalg }}
              </option>
            </select>

            <div style="display: flex; flex-direction: row">
              <div
                style="
                  margin-top: 10px;
                  display: flex;
                  flex-direction: row;
                  position: relative;
                "
                v-for="(utvalg, index) in datasett.utvalgtPriority"
                :key="index"
                :disabled="!edit"
              >
                {{ utvalg }}
                <div
                  style="padding-left: 4px; margin-top: 4px; font-size: 12px"
                  @click="removeUtvalgset(index, $event)"
                >
                  ×
                </div>
                <img
                  v-if="datasett.utvalgtPriority[index + 1]"
                  style="
                    padding-left: 5px;
                    padding-right: 8px;
                    max-width: 40px;
                    max-height: 14px;
                  "
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="labels" style="padding-left: 30px">{{
            $t('instances-heading')
          }}</label>
          <div style="margin-bottom: 10px">
            <div
              v-for="(utvalg, index) in datasett.utvalgtPriority"
              :key="index"
            >
              <div
                class="utvalg"
                style="
                  width: 600px;
                  border-bottom: 1px solid #f05d5d;
                  margin-top: 5px;
                  left: 85px;
                "
                v-for="(subsett, subsettIndex) in datasett.utvalg[utvalg]"
                :key="subsettIndex"
              >
                {{ utvalg }} :{{ subsett['title'] }}
                <img
                  @click="
                    deleteUtvalg(
                      {
                        subsett:
                          datasett.utvalg[datasett.utvalgtPriority[index]],
                        index: subsettIndex,
                      },
                      $event
                    )
                  "
                  style="height: 15px"
                />
                <span
                  class="span_class"
                  v-if="datasett.utvalgtPriority[index + 1]"
                >
                  {{ $t('new') }} {{ datasett.utvalgtPriority[index + 1] }}
                  <button
                    class="button"
                    :disabled="!edit"
                    @click="
                      toggleInput(
                        {
                          value: datasett.utvalgtPriority[index + 1],
                          index: index + 1,
                          subsett: subsett,
                        },
                        $event
                      )
                    "
                  >
                    +
                  </button>
                </span>

                <div
                  style="padding-left: 20px"
                  v-for="(firstUtvalg, firstIndex) in subsett[
                    datasett.utvalgtPriority[index + 1]
                  ]"
                  :key="firstIndex"
                >
                  {{ datasett.utvalgtPriority[index + 1] }} :{{
                    firstUtvalg['title']
                  }}
                  <img
                    @click="
                      deleteUtvalg(
                        {
                          subsett: subsett[datasett.utvalgtPriority[index + 1]],
                          index: firstIndex,
                        },
                        $event
                      )
                    "
                    style="height: 15px"
                  />
                  <span
                    class="span_class"
                    v-if="datasett.utvalgtPriority[index + 2]"
                  >
                    {{ $t('new') }} {{ datasett.utvalgtPriority[index + 2] }}
                    <button
                      :disabled="!edit"
                      class="button"
                      @click="
                        toggleInput({
                          value: datasett.utvalgtPriority[index + 2],
                          index: index + 2,
                          subsett: firstUtvalg,
                        })
                      "
                    >
                      +
                    </button>
                  </span>
                  <div
                    style="padding-left: 20px"
                    v-for="(secondUtvalg, secondIndex) in firstUtvalg[
                      datasett.utvalgtPriority[index + 2]
                    ]"
                    :key="secondIndex"
                  >
                    {{ datasett.utvalgtPriority[index + 2] }} :{{
                      secondUtvalg['title']
                    }}
                    <img
                      @click="
                        deleteUtvalg(
                          {
                            subsett:
                              firstUtvalg[datasett.utvalgtPriority[index + 2]],
                            index: secondIndex,
                          },
                          $event
                        )
                      "
                      style="height: 15px"
                    />
                    <span
                      class="span_class"
                      v-if="datasett.utvalgtPriority[index + 3]"
                    >
                      {{ $t('new') }} {{ datasett.utvalgtPriority[index + 3] }}
                      <button
                        class="button"
                        @click="
                          toggleInput({
                            value: datasett.utvalgtPriority[index + 3],
                            index: index + 3,
                            subsett: secondUtvalg,
                          })
                        "
                      >
                        +
                      </button>
                    </span>
                    <div
                      style="padding-left: 20px"
                      v-for="(thirdUtvalg, thirdIndex) in secondUtvalg[
                        datasett.utvalgtPriority[index + 3]
                      ]"
                      :key="thirdIndex"
                    >
                      {{ datasett.utvalgtPriority[index + 3] }} :{{
                        thirdUtvalg['title']
                      }}
                      <img
                        @click="
                          deleteUtvalg(
                            {
                              subsett:
                                secondUtvalg[
                                  datasett.utvalgtPriority[index + 3]
                                ],
                              index: thirdIndex,
                            },
                            $event
                          )
                        "
                        style="height: 15px"
                      />
                      <span
                        class="span_class"
                        v-if="datasett.utvalgtPriority[index + 4]"
                      >
                        {{ $t('new') }}
                        {{ datasett.utvalgtPriority[index + 4] }}
                        <button
                          class="button"
                          @click="
                            toggleInput({
                              value: datasett.utvalgtPriority[index + 4],
                              index: index + 4,
                              subsett: thirdUtvalg,
                            })
                          "
                        >
                          +
                        </button>
                      </span>
                      <div
                        style="padding-left: 20px"
                        v-for="(fourthUtvalg, fourthIndex) in thirdUtvalg[
                          datasett.utvalgtPriority[index + 4]
                        ]"
                        :key="fourthIndex"
                      >
                        {{ datasett.utvalgtPriority[index + 4] }} :{{
                          fourthUtvalg['title']
                        }}
                        <img
                          @click="
                            deleteUtvalg(
                              {
                                subsett:
                                  thirdUtvalg[
                                    datasett.utvalgtPriority[index + 4]
                                  ],
                                index: fourthIndex,
                              },
                              $event
                            )
                          "
                          style="height: 15px"
                        />
                        <span
                          class="span_class"
                          v-if="datasett.utvalgtPriority[index + 5]"
                        >
                          {{ $t('new') }}
                          {{ datasett.utvalgtPriority[index + 5] }}
                          <button
                            class="button"
                            @click="
                              toggleInput({
                                value: datasett.utvalgtPriority[index + 5],
                                index: index + 5,
                                subsett: fourthUtvalg,
                              })
                            "
                          >
                            +
                          </button>
                        </span>
                        <div
                          style="padding-left: 20px"
                          v-for="(fifthUtvalg, fifthIndex) in fourthUtvalg[
                            datasett.utvalgtPriority[index + 5]
                          ]"
                          :key="fifthIndex"
                        >
                          {{ datasett.utvalgtPriority[index + 5] }} :{{
                            fifthUtvalg['title']
                          }}
                          <img
                            @click="
                              deleteUtvalg(
                                {
                                  subsett:
                                    fourthUtvalg[
                                      datasett.utvalgtPriority[index + 5]
                                    ],
                                  index: fifthIndex,
                                },
                                $event
                              )
                            "
                            style="height: 15px"
                          />
                          <span
                            class="span_class"
                            v-if="datasett.utvalgtPriority[index + 6]"
                          >
                            {{ $t('new') }}
                            {{ datasett.utvalgtPriority[index + 6] }}
                            <button
                              class="button"
                              @click="
                                toggleInput({
                                  value: datasett.utvalgtPriority[index + 6],
                                  index: index + 6,
                                  subsett: fifthUtvalg,
                                })
                              "
                            >
                              +
                            </button>
                          </span>
                          <div
                            style="padding-left: 20px"
                            v-for="(sixthUtvalg, sixthIndex) in fifthUtvalg[
                              datasett.utvalgtPriority[index + 6]
                            ]"
                            :key="sixthIndex"
                          >
                            {{ datasett.utvalgtPriority[index + 6] }} :{{
                              sixthUtvalg['title']
                            }}
                            <img
                              @click="
                                deleteUtvalg(
                                  {
                                    subsett:
                                      fifthUtvalg[
                                        datasett.utvalgtPriority[index + 6]
                                      ],
                                    index: sixthIndex,
                                  },
                                  $event
                                )
                              "
                              style="height: 15px"
                            />
                            <span
                              class="span_class"
                              v-if="datasett.utvalgtPriority[index + 7]"
                            >
                              {{ $t('new') }}
                              {{ datasett.utvalgtPriority[index + 7] }}
                              <button
                                class="button"
                                @click="
                                  toggleInput({
                                    value: datasett.utvalgtPriority[index + 7],
                                    index: index + 7,
                                    subsett: sixthUtvalg,
                                  })
                                "
                              >
                                +
                              </button>
                            </span>
                            <div
                              style="padding-left: 20px"
                              v-for="(
                                seventhUtvalg, seventhIndex
                              ) in sixthUtvalg[
                                datasett.utvalgtPriority[index + 7]
                              ]"
                              :key="seventhIndex"
                            >
                              {{ datasett.utvalgtPriority[index + 7] }} :{{
                                seventhUtvalg['title']
                              }}
                              <img
                                @click="
                                  deleteUtvalg(
                                    {
                                      subsett:
                                        sixthUtvalg[
                                          datasett.utvalgtPriority[index + 7]
                                        ],
                                      index: seventhIndex,
                                    },
                                    $event
                                  )
                                "
                                style="height: 15px"
                              />
                              <span
                                class="span_class"
                                v-if="datasett.utvalgtPriority[index + 8]"
                              >
                                {{ $t('new') }}
                                {{ datasett.utvalgtPriority[index + 8] }}
                                <button
                                  class="button"
                                  @click="
                                    toggleInput({
                                      value:
                                        datasett.utvalgtPriority[index + 8],
                                      index: index + 8,
                                      subsett: seventhUtvalg,
                                    })
                                  "
                                >
                                  +
                                </button>
                              </span>
                              <div
                                style="padding-left: 20px"
                                v-for="(
                                  eigthUtvalg, eigthIndex
                                ) in seventhUtvalg[
                                  datasett.utvalgtPriority[index + 8]
                                ]"
                                :key="eigthIndex"
                              >
                                {{ datasett.utvalgtPriority[index + 8] }} :{{
                                  eigthUtvalg['title']
                                }}
                                <img
                                  @click="
                                    deleteUtvalg(
                                      {
                                        subsett:
                                          seventhUtvalg[
                                            datasett.utvalgtPriority[index + 8]
                                          ],
                                        index: eigthIndex,
                                      },
                                      $event
                                    )
                                  "
                                  style="height: 15px"
                                />
                                <span
                                  class="span_class"
                                  v-if="datasett.utvalgtPriority[index + 9]"
                                >
                                  {{ $t('new') }}
                                  {{ datasett.utvalgtPriority[index + 9] }}
                                  <button
                                    class="button"
                                    @click="
                                      toggleInput({
                                        value:
                                          datasett.utvalgtPriority[index + 9],
                                        index: index + 9,
                                        subsett: eigthUtvalg,
                                      })
                                    "
                                  >
                                    +
                                  </button>
                                </span>
                                <div
                                  style="padding-left: 20px"
                                  v-for="(
                                    ninthUtvalg, ninthIndex
                                  ) in eigthUtvalg[
                                    datasett.utvalgtPriority[index + 9]
                                  ]"
                                  :key="ninthIndex"
                                >
                                  {{ datasett.utvalgtPriority[index + 9] }} :{{
                                    ninthUtvalg['title']
                                  }}
                                  <img
                                    @click="
                                      deleteUtvalg(
                                        {
                                          subsett:
                                            eigthUtvalg[
                                              datasett.utvalgtPriority[
                                                index + 9
                                              ]
                                            ],
                                          index: ninthIndex,
                                        },
                                        $event
                                      )
                                    "
                                    style="height: 15px"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="md-layout" style="margin-top: 15px">
              <span
                style="padding-left: 85px"
                v-if="datasett.utvalgtPriority[0]"
              >
                Ny {{ datasett.utvalgtPriority[0] }}
                <button class="button">+</button>
              </span>
              <inputAttribute
                style="padding-left: 15px; margin-top: 5px"
                v-if="showUserInput.value && showUserInput.value != 'TSD'"
                :collector="'subsett'"
                :index="
                  datasett.utvalgtPriority.indexOf(
                    datasett.utvalgtPriority[showUserInput.index]
                  )
                "
                :utvalgPriority="datasett.utvalgtPriority"
                @subsett-added="subsettAdded"
                :subsett="showUserInput.subsett"
              ></inputAttribute>
            </div>
          </div>
        </div>
      </div>
      <behandling :edit="edit" :datasett="datasett"></behandling>
      <div class="layout">
        <div class="labels" style="padding-left: 30px">
          {{ $t('add-storage') }}
        </div>
        <div style="padding-left: 85px">
          <label style="font-size: 18px" class="labels">{{
            $t('add-generic')
          }}</label>

          <button :disabled="!edit" class="button" @click="addStorage()">
            +
          </button>
        </div>
        <div class="small-flex-container" style="padding-left: 75px">
          <div
            style="font-size: 14px"
            v-for="(s, storageIndex) in datasett.storages"
            :key="storageIndex"
          >
            <div>
              <span>{{ $t('storage-heading') }}:</span>
              <div style="padding-left: 20px">
                <select
                  span
                  :disabled="!edit"
                  v-model="datasett.storages[storageIndex].name"
                  class="select"
                  style="width: 150px; padding-left: 20px"
                  @change="onStorageChange(storageIndex)"
                  placeholder
                >
                  <option
                    v-for="(storage, index) in storages"
                    :value="index"
                    :key="index"
                  >
                    {{ storage }}
                  </option>
                </select>
                <img
                  @click="deleteStorage(storageIndex, $event)"
                  style="height: 15px"
                />
              </div>
            </div>
            <div>
              <span>{{ $t('category-promt') }}:</span>
              <div
                style="display: flex; flex-direction: row; padding-left: 20px"
              >
                <div
                  v-for="(list, index) in categoryList[
                    datasett.storages[storageIndex].name
                  ]"
                  :key="index"
                >
                  {{ list }}
                  <input
                    :disabled="!edit"
                    type="checkbox"
                    :value="list"
                    v-model="datasett.storages[storageIndex].category"
                  />
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: row">
              <div
                v-for="(list, index) in groupList[
                  datasett.storages[storageIndex].name
                ]"
                :key="index"
              >
                <div
                  v-if="
                    datasett.storages[storageIndex].name == 'lagringshotell'
                  "
                >
                  <span style="padding-right: 90px; margin-top: 10px"
                    >{{ $t('filegoup-prompt') }}:</span
                  >
                  <div style="padding-left: 20px">
                    <select
                      :disabled="!edit"
                      span
                      class="select"
                      style="width: 120px"
                      v-model="datasett.storages[storageIndex].groupId"
                    >
                      <option
                        v-for="(filegroup, index) in fileGroups"
                        :value="filegroup"
                        :key="index"
                      >
                        {{ filegroup }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div
              style="
                display: flex;
                flex-direction: row;
                position: relative;
                margin-top: 3px;
              "
              v-for="(value, name) in datasett.storages[storageIndex]
                .storagePath"
              :key="name"
            >
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  position: relative;
                "
              >
                <span v-if="name == 'path'">{{ $t('path-promt') }}:</span>
                <span v-else-if="name == 'fileName'"
                  >{{ $t('filename-promt') }}:</span
                >
                <span style="padding-left: 20px">
                  <select
                    :disabled="!edit"
                    span
                    :ref="name"
                    @change="onNameChange(storageIndex, name)"
                    class="select"
                    style="width: 120px"
                    placeholder
                  >
                    <!-- <option :value="0">Lagre i {{name}}</option> -->
                    <option
                      v-for="(filename, index) in fileAttributes[name]"
                      :value="filename"
                      :key="index"
                    >
                      {{ filename }}
                    </option>
                  </select>
                </span>
                <div
                  style="padding-left: 20px; display: flex; flex-direction: row"
                >
                  <div
                    v-for="(nameAttribute, index) in datasett.storages[
                      storageIndex
                    ].storagePath[name]"
                    :key="index"
                  >
                    <span style="padding-left: 10px">{{ nameAttribute }}</span>
                    <span
                      style="padding-top: 1px; font-size: 12px"
                      @click="
                        removeFilenameField(index, storageIndex, name, $event)
                      "
                      >×</span
                    >
                    <span
                      style="margin-left: 5px"
                      v-if="
                        datasett.storages[storageIndex].storagePath[name][
                          index + 1
                        ]
                      "
                      >-</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       <div style="margin-bottom: 10px">

          <button
            v-show="false"
            @click="editDatasett()"
            disabled="true"
            class="button"
            style="width: 100px; padding: 10px; font-sizex: 16px"
          >
            {{ $t('edit-button') }}
          </button>
          <button
            v-if="edit"
            :disabled="checkCriteria()"
            @click="saveDatasett()"
            class="button"
            style="width: 100px; padding: 10px; font-sizex: 16px"
          >
            {{ $t('save-button') }}
          </button>
          <button
            @click="cancel()"
            class="button"
            style="width: 100px; padding: 10px; font-sizex: 16px"
          >
            {{ $t('cancel-button') }}
          </button>
          <label
            class="labels"
            style="font-size: 14px"
            v-if="checkCriteria() == true"
          >
            <br />
            **{{ warning }} <br />I18N**Mandatory fields must be filled in
            before datasett can be sxaved
            {{ $t('save-notification') }}
          </label>
          <!-- <button
        v-show="false"
        class="button"
        style="padding:10px;font-sizex:16px"
        @click="toggleInput({value:'TSD'})"
      >Log into TSD to publish utvalgset</button>
      {{showUserInput.value}}
      <inputAttribute
        style="padding-left:15px;margin-top:5px"
        v-if="showUserInput.value==='TSD'"
        :collector="'TSD'"
        @create-consentForm="createConsentForm"
        ></inputAttribute>-->
        </div>
      </div>
    </div>
  </template>
</template>
