import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageData } from '../types'

export const usePagesStore = defineStore('pages-data', () => {
    const loadedPages = ref<Record<number, PageData>>({
        1:{id: 1, title: "A1", type: 'page', data: [
            {
                text: "THIS PAGE IS HARDCODED 😭"
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
            },
            {
                text:"😭"
            }]
        , path: [{title: 'A1'}]},
        2:{id: 2, title: "A2", type: 'object', data: {}, path: [{title: 'A2'}]},
        3:{id: 3, title: "A3", type: 'table', data: {}, path: [{title: 'A3'}]},
        4:{id: 4, title: "A4", type: 'page', data: {}, path: [{title: 'A4'}]},
    })

    const closePage = (id: number) => {
        delete loadedPages.value[id]
    }

    const openPage = (id: number, pageData: PageData) => {
        loadedPages.value[id] = pageData
    }

    const getPageById = computed(() => {
        return (id: number) => loadedPages.value[id] || null
    })

    const hasPage = computed(() => {
        return (id: number) => id in loadedPages.value
    })

    return { 
        loadedPages, 
        closePage, 
        openPage, 
        getPageById, 
        hasPage 
    }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePagesStore, import.meta.hot))
}