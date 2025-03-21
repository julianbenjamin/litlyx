<script lang="ts" setup>

import { useSelectMenuStyle } from '~/composables/ui/useSelectMenuStyle';
import type { TAdminUser } from '~/server/api/admin/users';
import { sub, format, isSameDay, type Duration, startOfDay, endOfDay } from 'date-fns'



const filterText = ref<string>('');

watch(filterText, () => {
    page.value = 1;
})

function isRangeSelected(duration: Duration) {
    return isSameDay(selected.value.start, sub(new Date(), duration)) && isSameDay(selected.value.end, new Date())
}

function selectRange(duration: Duration) {
    selected.value = { start: sub(new Date(), duration), end: new Date() }
}

const ranges = [
    { label: 'Last 7 days', duration: { days: 7 } },
    { label: 'Last 14 days', duration: { days: 14 } },
    { label: 'Last 30 days', duration: { days: 30 } },
    { label: 'Last 3 months', duration: { months: 3 } },
    { label: 'Last 6 months', duration: { months: 6 } },
    { label: 'Last year', duration: { years: 1 } }
]
const selected = ref<{ start: Date, end: Date }>({ start: sub(new Date(), { days: 14 }), end: new Date() })

const filter = computed(() => {
    return JSON.stringify({
        $or: [
            { given_name: { $regex: `.*${filterText.value}.*`, $options: "i" } },
            { email: { $regex: `.*${filterText.value}.*`, $options: "i" } }
        ]
    })
})

const page = ref<number>(1);

const ordersList = [
    { label: 'created_at -->', id: '{ "created_at": 1 }' },
    { label: 'created_at <--', id: '{ "created_at": -1 }' },
]

const order = ref<string>('{ "created_at": -1 }');


const limitList = [
    { label: '10', id: 10 },
    { label: '20', id: 20 },
    { label: '50', id: 50 },
    { label: '100', id: 100 },
]

const limit = ref<number>(20);

const { data: usersInfo, pending: pendingUsers } = await useFetch<{ count: number, users: TAdminUser[] }>(
    () => `/api/admin/users?page=${page.value - 1}&limit=${limit.value}&sortQuery=${order.value}&filterQuery=${filter.value}&filterFrom=${selected.value.start.toISOString()}&filterTo=${selected.value.end.toISOString()}`,
    signHeaders()
);

const { uiMenu } = useSelectMenuStyle();

</script>

<template>
    <div class="mt-6 h-full">


        <div class="flex flex-col items-center gap-6">

            <div class="flex items-center gap-10 px-10">
                <div class="flex gap-2 items-center">
                    <div>Order:</div>
                    <USelectMenu :uiMenu="uiMenu" class="w-[12rem]" placeholder="Order" :options="ordersList"
                        value-attribute="id" option-attribute="label" v-model="order">
                    </USelectMenu>
                </div>


                <div class="flex gap-2 items-center">
                    <div>Limit:</div>
                    <USelectMenu :uiMenu="uiMenu" class="w-[12rem]" placeholder="Limit" :options="limitList"
                        value-attribute="id" option-attribute="label" v-model="limit">
                    </USelectMenu>
                </div>

                <div class="flex gap-2 items-center">
                    <LyxUiInput placeholder="Search user" class="px-2 py-1" v-model="filterText"></LyxUiInput>
                </div>
            </div>

            <div class="flex items-centet gap-10">
                <div class="flex gap-2 items-center">
                    <div>Page {{ page }} </div>
                    <div>
                        {{ Math.min(limit, usersInfo?.count || 0) }}
                        of
                        {{ usersInfo?.count || 0 }}
                    </div>
                </div>

                <div>
                    <UPagination v-model="page" :page-count="limit" :total="usersInfo?.count || 0" />
                </div>

                <UPopover class="w-[20rem]" :popper="{ placement: 'bottom' }">
                    <UButton class="w-full" color="primary" variant="solid">
                        <div class="flex items-center justify-center w-full gap-2">
                            <i class="i-heroicons-calendar-days-20-solid"></i>
                            {{ selected.start.toLocaleDateString() }} - {{ selected.end.toLocaleDateString() }}
                        </div>
                    </UButton>
                    <template #panel="{ close }">
                        <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                            <div class="hidden sm:flex flex-col py-4">
                                <UButton v-for="(range, index) in ranges" :key="index" :label="range.label" color="gray"
                                    variant="ghost" class="rounded-none px-6"
                                    :class="[isRangeSelected(range.duration) ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                                    truncate @click="selectRange(range.duration)" />
                            </div>

                            <DatePicker v-model="selected" @close="close" />
                        </div>
                    </template>
                </UPopover>

            </div>

        </div>




        <div
            class="cursor-default flex justify-center flex-wrap gap-6 mb-[4rem] mt-4 overflow-auto h-full pt-6 pb-[8rem]">

            <AdminUsersUserCard v-if="!pendingUsers" :key="user._id.toString()" :user="user" class="w-[26rem]"
                v-for="user of usersInfo?.users" />

            <div v-if="pendingUsers"> Loading...</div>

        </div>
    </div>
</template>

<style scoped lang="scss"></style>