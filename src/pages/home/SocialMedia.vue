<script setup lang="ts">
import {homeConfig} from "@/config/index.js";
</script>

<template>
    <div class="container">
        <span class="title">官方社媒</span>
        <div class="content">
            <div class="card">
                <span class="card-title">QQ群聊</span>
                <div class="info">
                    {{ homeConfig.content.qq_group_name }}
                    &nbsp;-&nbsp;
                    <a :href="homeConfig.content.qq_join_link" target="_blank" rel="noopener noreferrer">
                        {{ homeConfig.content.qq_group }}
                    </a>
                </div>
            </div>
            <hr/>
            <div class="card">
                <span class="card-title">Bilibili账号</span>
                <div class="info">
                    {{ homeConfig.content.bilibili_name }}
                    &nbsp;-&nbsp;UID:
                    <a :href="'https://space.bilibili.com/' + homeConfig.content.bilibili_uid"
                       target="_blank" rel="noopener noreferrer">
                        {{ homeConfig.content.bilibili_uid }}
                    </a>
                </div>
            </div>
            <hr/>
            <div class="card">
                <span class="card-title">Teamspeak服务器</span>
                <div class="info">
                    <p>
                        服务器&nbsp;-&nbsp;
                        <a :href="'ts3server://'+homeConfig.content.teamspeak_server"
                           target="_blank" rel="noopener noreferrer">
                            {{ homeConfig.content.teamspeak_server }}
                        </a>
                    </p>
                    <p>
                        密码&nbsp;-&nbsp;
                        {{
                            homeConfig.content.teamspeak_server_password == '' ? 'N/A' : homeConfig.content.teamspeak_server_password
                        }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex-grow: 1;
    width: 100%;

    .title {
        font-size: 2.5rem;
        font-weight: 600;
        color: $color-primary;
    }

    .card-title {
        display: flex;
        align-items: center;
        font-size: 1.5rem;
        font-weight: 600;
        color: $color-primary;
        border-left: 5px solid $color-primary;
        padding-left: 10px;
        height: 50px;
        margin: 30px 0;
    }

    .content {
        display: flex;
        flex-direction: column;
        justify-items: flex-start;
        width: 75%;

        hr {
            margin: .5rem 0;
        }

        .card {
            margin: 2rem 0;

            .info {
                font-size: 1.2rem;
            }
        }
    }
}
</style>