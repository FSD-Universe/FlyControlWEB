import {createRouter, createWebHistory, RouteRecordRaw} from "vue-router";
import {useUserStore} from "@/store/user.js";
import {PermissionNode} from "@/utils/permission.js";
import {showError} from "@/utils/message.js";
import request from "@/api/request.js";
import Portal from "@/pages/home/Portal.vue";
import Login from "@/pages/user/Login.vue";
import Register from "@/pages/user/Register.vue";
import ActivityStatus from "@/pages/controller/ActivityStatus.vue";
import Activity from "@/pages/activity/Activity.vue";
import ActivityDetail from "@/pages/activity/ActivityDetail.vue";
import Profile from "@/pages/controller/Profile.vue";
import Ticket from "@/pages/Ticket.vue";
import Users from "@/pages/admin/user/Users.vue";
import Controllers from "@/pages/admin/controller/Controllers.vue";
import Activities from "@/pages/admin/activity/Activities.vue";
import ActivityEdit from "@/pages/admin/activity/ActivityEdit.vue";
import ActivityCreate from "@/pages/admin/activity/ActivityCreate.vue";
import Online from "@/pages/admin/Online.vue";
import Tickets from "@/pages/admin/Tickets.vue";
import Permissions from "@/pages/admin/permission/Permissions.vue";
import EditPermission from "@/pages/admin/permission/EditPermission.vue";
import Audit from "@/pages/admin/Audit.vue";
import Settings from "@/pages/user/Settings.vue";
import Home from "@/pages/Home.vue";
import Application from "@/pages/controller/Application.vue";
import {homeConfig} from "@/config/index.js";
import SocialMedia from "@/pages/home/SocialMedia.vue";
import Meetings from "@/pages/home/Meetings.vue";
import Staff from "@/pages/home/Staff.vue";
import Metar from "@/pages/home/Metar.vue";
import Software from "@/pages/home/Software.vue";
import BecomeController from "@/pages/home/BecomeController.vue";
import Ratings from "@/pages/home/Ratings.vue";
import ControllerRecord from "@/pages/admin/controller/ControllerRecord.vue";
import {Ratings as ratings} from "@/global.js";
import Applications from "@/pages/admin/controller/Applications.vue";
import FlightPlan from "@/pages/FlightPlan.vue";
import FlightPlanList from "@/pages/admin/FlightPlanList.vue";
import Announcement from "@/pages/admin/Announcement.vue";
import ForgotPassword from "@/pages/user/ForgotPassword.vue";
import Charts from "@/pages/Charts.vue";
import Weather from "@/pages/Weather.vue";

const isController = (userData: UserModel): boolean => {
    return userData.rating >= ratings.Observer;
}

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "Root",
        component: () => import("@/layout/HeaderLayout.vue"),
        meta: {
            requireAuth: false,
            title: "门户网页"
        },
        children: [
            {
                path: "/",
                name: "RootPortal",
                component: Portal,
                meta: {
                    requireAuth: false,
                    title: homeConfig.title
                }
            },
            {
                path: "/social",
                name: "SocialMedia",
                component: SocialMedia,
                meta: {
                    requireAuth: false,
                    title: "官方社媒"
                }
            },
            {
                path: "/meeting",
                name: "Meeting",
                component: Meetings,
                meta: {
                    requireAuth: false,
                    title: "会议记录"
                }
            },
            {
                path: "/staff",
                name: "Staff",
                component: Staff,
                meta: {
                    requireAuth: false,
                    title: "职员"
                }
            },
            {
                path: "/metar",
                name: "Metar",
                component: Metar,
                meta: {
                    requireAuth: false,
                    title: "气象报文查询"
                }
            },
            {
                path: "/software",
                name: "Software",
                component: Software,
                meta: {
                    requireAuth: false,
                    title: "软件下载"
                }
            },
            {
                path: "/application",
                name: "BecomeController",
                component: BecomeController,
                meta: {
                    requireAuth: false,
                    title: "成为管制员"
                }
            },
            {
                path: "/ratings",
                name: "Ratings",
                component: Ratings,
                meta: {
                    requireAuth: false,
                    title: "管制员权限公示"
                }
            }
        ]
    },
    {
        path: "/login",
        name: "Login",
        component: Login,
        meta: {
            requireAuth: false,
            title: "登录页"
        }
    },
    {
        path: "/reset-password",
        name: "ResetPassword",
        component: ForgotPassword,
        meta: {
            requireAuth: false,
            title: "重置密码"
        }
    },
    {
        path: "/register",
        name: "Register",
        component: Register,
        meta: {
            requireAuth: false,
            title: "注册页"
        }
    },
    {
        path: "/main",
        name: "Main",
        component: () => import("@/layout/SidebarLayout.vue"),
        meta: {
            requireAuth: true
        },
        children: [
            {
                path: "/home",
                name: "Home",
                component: Home,
                meta: {
                    requireAuth: true,
                    title: "主页"
                }
            },
            {
                path: "/activities",
                name: "Activity",
                component: Activity,
                meta: {
                    requireAuth: true,
                    title: "活动页"
                }
            },
            {
                path: "/activities/:id",
                name: "ActivityDetail",
                component: ActivityDetail,
                meta: {
                    requireAuth: true,
                    title: "活动详情页"
                }
            },
            {
                path: "/online-map",
                name: "OnlineMap",
                component: () => import("@/pages/OnlineMap.vue"),
                meta: {
                    requireAuth: true,
                    title: "在线地图"
                }
            },
            {
                path: "/charts",
                name: "Charts",
                component: Charts,
                meta: {
                    requireAuth: true,
                    title: "航图查询"
                }
            },
            {
                path: "/weather",
                name: "Weather",
                component: Weather,
                meta: {
                    requireAuth: true,
                    title: "气象报文查询"
                }
            },
            {
                path: "/flight-plan",
                name: "FlightPlan",
                component: FlightPlan,
                meta: {
                    requireAuth: true,
                    title: "飞行计划"
                }
            },
            {
                path: "/controllers/application",
                name: "Application",
                component: Application,
                meta: {
                    requireAuth: true,
                    title: "管制员申请"
                }
            },
            {
                path: "/controllers/activity",
                name: "ControllerActivity",
                component: ActivityStatus,
                meta: {
                    requireAuth: true,
                    title: "活动登记",
                    authFunction: isController
                }
            },
            {
                path: "/controllers/profile",
                name: "ControllerProfile",
                component: Profile,
                meta: {
                    requireAuth: true,
                    title: "管制员档案",
                    authFunction: isController
                }
            },
            {
                path: "/ticket",
                name: "Ticket",
                component: Ticket,
                meta: {
                    requireAuth: true,
                    title: "投诉与反馈中心"
                }
            },
            {
                path: "/admin/users",
                name: "AdminUsers",
                component: Users,
                meta: {
                    requireAuth: true,
                    title: "用户管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.UserShowList
                }
            },
            {
                path: "/admin/applications",
                name: "AdminApplications",
                component: Applications,
                meta: {
                    requireAuth: true,
                    title: "管制员申请管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ControllerApplicationShowList
                }
            },
            {
                path: "/admin/controllers",
                name: "AdminControllers",
                component: Controllers,
                meta: {
                    requireAuth: true,
                    title: "管制员管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.UserShowList | PermissionNode.ControllerShowList
                }
            },
            {
                path: "/admin/controllers/:id",
                name: "AdminControllerRecord",
                component: ControllerRecord,
                meta: {
                    requireAuth: true,
                    title: "管制员履历管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ControllerShowList | PermissionNode.ControllerShowRecord
                }
            },
            {
                path: "/admin/activities",
                name: "AdminActivities",
                component: Activities,
                meta: {
                    requireAuth: true,
                    title: "活动管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ActivityShowList
                }
            },
            {
                path: "/admin/activities/:id",
                name: "AdminActivityEdit",
                component: ActivityEdit,
                meta: {
                    requireAuth: true,
                    title: "编辑活动",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ActivityShowList | PermissionNode.ActivityEdit
                }
            },
            {
                path: "/admin/activities/new",
                name: "AdminActivityCreate",
                component: ActivityCreate,
                meta: {
                    requireAuth: true,
                    title: "新建活动",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ActivityShowList | PermissionNode.ActivityPublish
                }
            },
            {
                path: "/admin/flight-plan",
                name: "AdminFlightPlan",
                component: FlightPlanList,
                meta: {
                    requireAuth: true,
                    title: "飞行计划管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.FlightPlanShowList
                }
            },
            {
                path: "/admin/announcements",
                name: "AdminAnnouncements",
                component: Announcement,
                meta: {
                    requireAuth: true,
                    title: "公告管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.AnnouncementShowList
                }
            },
            {
                path: "/admin/clients",
                name: "AdminClients",
                component: Online,
                meta: {
                    requireAuth: true,
                    title: "在线管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.ClientManagerEntry
                }
            },
            {
                path: "/admin/tickets",
                name: "AdminTickets",
                component: Tickets,
                meta: {
                    requireAuth: true,
                    title: "工单管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.TicketShowList
                }
            },
            {
                path: "/admin/permissions",
                name: "AdminPermissions",
                component: Permissions,
                meta: {
                    requireAuth: true,
                    title: "权限管理",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.UserShowPermission
                }
            },
            {
                path: "/admin/permissions/:id",
                name: "AdminEditPermission",
                component: EditPermission,
                meta: {
                    requireAuth: true,
                    title: "编辑用户权限",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.UserShowPermission | PermissionNode.UserEditPermission
                }
            },
            {
                path: "/admin/audit",
                name: "AdminAudit",
                component: Audit,
                meta: {
                    requireAuth: true,
                    title: "审计日志",
                    requirePermission: PermissionNode.AdminEntry | PermissionNode.AuditLogShow
                }
            },
            {
                path: "/profile",
                name: "Profile",
                component: Settings,
                meta: {
                    requireAuth: true,
                    title: "个人中心"
                }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _, next) => {
    if (to.meta.title != null) {
        document.title = to.meta.title;
    }
    const userStore = useUserStore();
    if (to.meta.requireAuth) {
        if (userStore.isLogin) {
            if ((to.meta.requirePermission == undefined || userStore.permission.hasPermission(to.meta.requirePermission)) &&
                (to.meta.authFunction == undefined || to.meta.authFunction(userStore.userData))) {
                next()
            } else {
                request.post("/audits/unlawful_overreach",
                    {access_path: to.fullPath},
                    {headers: {"Authorization": `Bearer ${userStore.token}`}})
                    .then(_ => {
                        showError("非法的越权访问, 日志已记录")
                        userStore.logout()
                    })
            }
        } else {
            next({
                path: '/login',
                query: {redirect: to.fullPath}
            })
        }
    } else {
        next()
    }
})

export default router;