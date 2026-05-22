import { PageRepository } from '@/core/infra/pages/stubPageRepostory'
import type { PageData } from '@/modules/contracts/pageRepositoryContract'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePageStore = defineStore('page', () => {
  const pageData = ref<PageData>()

  const isSaving = ref(false)
  const isLoading = ref(false)

  const updateContent = async (conten: Object) => {
    if (pageData.value !== undefined) {
      pageData.value.content = conten
      await saveToDatabase()
    }
  }

  const saveToDatabase = async () => {
    isSaving.value = true
    if (pageData.value !== undefined) {
      await PageRepository.save(pageData.value)
    }
    isSaving.value = false
  }

  const getFromDatabase = async (pageId: number) => {
    isLoading.value = true
    const result = await PageRepository.get(pageId)
    if (result) {
      pageData.value = result
    }
    isLoading.value = false    
  }


  return { 
    isSaving, 
    isLoading,
    pageData,
    updateContent,
    getFromDatabase
  }
})