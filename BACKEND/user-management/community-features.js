const EventEmitter = require('events');

class CommunityFeatures extends EventEmitter {
    constructor() {
        super();
        this.communityPosts = new Map();
        this.fishermenGroups = new Map();
        this.safetyReports = new Map();
        this.catchReports = new Map();
        this.communityAlerts = new Map();
        
        // Initialize sample data
        this.initializeSampleData();
    }

    // Initialize sample community data
    initializeSampleData() {
        // Sample community posts
        this.communityPosts.set('post_001', {
            id: 'post_001',
            userId: 'fisher_001',
            userName: 'Rajesh Kumar',
            type: 'SAFETY_TIP',
            title: 'Storm Warning - Stay Safe',
            content: 'Heavy storms expected in northern areas. All fishermen please return to shore by 3 PM.',
            location: { lat: 19.0760, lng: 72.8777 },
            category: 'SAFETY',
            likes: 15,
            comments: [
                { userId: 'fisher_002', userName: 'Suresh Patel', comment: 'Thanks for the warning!', timestamp: new Date().toISOString() }
            ],
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        // Sample fishermen groups
        this.fishermenGroups.set('group_001', {
            id: 'group_001',
            name: 'Mumbai Coastal Fishermen',
            description: 'Community of traditional fishermen from Mumbai coast',
            members: ['fisher_001', 'fisher_002', 'fisher_003'],
            location: { lat: 19.0760, lng: 72.8777 },
            radius: 50, // km
            createdBy: 'fisher_001',
            createdAt: new Date().toISOString()
        });

        // Sample safety reports
        this.safetyReports.set('report_001', {
            id: 'report_001',
            userId: 'fisher_002',
            type: 'HAZARD',
            title: 'Strong Currents near Harbor',
            description: 'Very strong currents observed near the harbor entrance. Be careful while navigating.',
            location: { lat: 19.0765, lng: 72.8780 },
            severity: 'HIGH',
            status: 'ACTIVE',
            confirmedBy: ['fisher_001'],
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });

        // Sample catch reports
        this.catchReports.set('catch_001', {
            id: 'catch_001',
            userId: 'fisher_003',
            userName: 'Amit Sharma',
            location: { lat: 19.0800, lng: 72.8800 },
            species: ['Pomfret', 'Mackerel'],
            totalWeight: 85, // kg
            fishingMethod: 'gillnet',
            weatherConditions: 'Clear',
            waterTemperature: 26,
            timestamp: new Date().toISOString(),
            verified: true
        });
    }

    // Create a new community post
    async createCommunityPost(postData) {
        try {
            const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const post = {
                id: postId,
                userId: postData.userId,
                userName: postData.userName,
                type: postData.type || 'GENERAL',
                title: postData.title,
                content: postData.content,
                location: postData.location,
                category: postData.category || 'GENERAL',
                likes: 0,
                comments: [],
                timestamp: new Date().toISOString(),
                expiresAt: postData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
            };

            this.communityPosts.set(postId, post);

            // Emit event for real-time updates
            this.emit('newPost', post);

            console.log(`📝 New community post created: ${postId}`);
            return {
                success: true,
                postId: postId,
                post: post
            };

        } catch (error) {
            console.error('❌ Failed to create community post:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get community posts for a location
    async getCommunityPosts(location, radiusKm = 50, category = 'ALL') {
        try {
            const posts = Array.from(this.communityPosts.values())
                .filter(post => {
                    // Filter by location
                    if (location && post.location) {
                        const distance = this.calculateDistance(
                            location.lat, location.lng,
                            post.location.lat, post.location.lng
                        );
                        if (distance > radiusKm) return false;
                    }

                    // Filter by category
                    if (category !== 'ALL' && post.category !== category) {
                        return false;
                    }

                    // Filter expired posts
                    return new Date(post.expiresAt) > new Date();
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return {
                success: true,
                posts: posts,
                total: posts.length,
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get community posts:', error);
            return {
                success: false,
                error: error.message,
                posts: []
            };
        }
    }

    // Like a community post
    async likePost(postId, userId) {
        try {
            const post = this.communityPosts.get(postId);
            
            if (!post) {
                throw new Error('Post not found');
            }

            // Check if user already liked (in real app, use proper tracking)
            post.likes += 1;

            this.communityPosts.set(postId, post);

            console.log(`👍 Post ${postId} liked by user ${userId}`);
            return {
                success: true,
                postId: postId,
                likes: post.likes
            };

        } catch (error) {
            console.error('❌ Failed to like post:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Add comment to community post
    async addComment(postId, commentData) {
        try {
            const post = this.communityPosts.get(postId);
            
            if (!post) {
                throw new Error('Post not found');
            }

            const comment = {
                userId: commentData.userId,
                userName: commentData.userName,
                comment: commentData.comment,
                timestamp: new Date().toISOString()
            };

            post.comments.push(comment);
            this.communityPosts.set(postId, post);

            // Emit event for real-time updates
            this.emit('newComment', { postId, comment });

            console.log(`💬 Comment added to post ${postId}`);
            return {
                success: true,
                postId: postId,
                comment: comment
            };

        } catch (error) {
            console.error('❌ Failed to add comment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Report safety hazard
    async reportSafetyHazard(reportData) {
        try {
            const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const report = {
                id: reportId,
                userId: reportData.userId,
                type: reportData.type,
                title: reportData.title,
                description: reportData.description,
                location: reportData.location,
                severity: reportData.severity || 'MEDIUM',
                status: 'ACTIVE',
                confirmedBy: [],
                timestamp: new Date().toISOString(),
                expiresAt: reportData.expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000)
            };

            this.safetyReports.set(reportId, report);

            // Emit alert to nearby fishermen
            this.emit('safetyHazardReported', report);

            console.log(`⚠️ Safety hazard reported: ${reportId}`);
            return {
                success: true,
                reportId: reportId,
                report: report
            };

        } catch (error) {
            console.error('❌ Failed to report safety hazard:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get active safety reports for location
    async getSafetyReports(location, radiusKm = 50) {
        try {
            const reports = Array.from(this.safetyReports.values())
                .filter(report => {
                    if (report.status !== 'ACTIVE') return false;

                    if (location && report.location) {
                        const distance = this.calculateDistance(
                            location.lat, location.lng,
                            report.location.lat, report.location.lng
                        );
                        return distance <= radiusKm;
                    }

                    return true;
                })
                .sort((a, b) => {
                    // Sort by severity and timestamp
                    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    return (severityOrder[b.severity] - severityOrder[a.severity]) || 
                           (new Date(b.timestamp) - new Date(a.timestamp));
                });

            return {
                success: true,
                reports: reports,
                total: reports.length,
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get safety reports:', error);
            return {
                success: false,
                error: error.message,
                reports: []
            };
        }
    }

    // Confirm safety report
    async confirmSafetyReport(reportId, userId) {
        try {
            const report = this.safetyReports.get(reportId);
            
            if (!report) {
                throw new Error('Safety report not found');
            }

            if (!report.confirmedBy.includes(userId)) {
                report.confirmedBy.push(userId);
                this.safetyReports.set(reportId, report);
            }

            console.log(`✅ Safety report ${reportId} confirmed by user ${userId}`);
            return {
                success: true,
                reportId: reportId,
                confirmedBy: report.confirmedBy,
                confirmationCount: report.confirmedBy.length
            };

        } catch (error) {
            console.error('❌ Failed to confirm safety report:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Report fishing catch
    async reportCatch(catchData) {
        try {
            const catchId = `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const catchReport = {
                id: catchId,
                userId: catchData.userId,
                userName: catchData.userName,
                location: catchData.location,
                species: catchData.species || [],
                totalWeight: catchData.totalWeight,
                fishingMethod: catchData.fishingMethod,
                weatherConditions: catchData.weatherConditions,
                waterTemperature: catchData.waterTemperature,
                notes: catchData.notes,
                timestamp: new Date().toISOString(),
                verified: false
            };

            this.catchReports.set(catchId, catchReport);

            // Emit event for catch analytics
            this.emit('catchReported', catchReport);

            console.log(`🎣 Catch reported: ${catchId}`);
            return {
                success: true,
                catchId: catchId,
                catchReport: catchReport
            };

        } catch (error) {
            console.error('❌ Failed to report catch:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get recent catch reports
    async getCatchReports(location = null, radiusKm = 50, limit = 20) {
        try {
            let reports = Array.from(this.catchReports.values());

            // Filter by location if provided
            if (location) {
                reports = reports.filter(report => {
                    if (!report.location) return false;
                    
                    const distance = this.calculateDistance(
                        location.lat, location.lng,
                        report.location.lat, report.location.lng
                    );
                    return distance <= radiusKm;
                });
            }

            // Sort by timestamp and limit
            reports = reports
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

            return {
                success: true,
                reports: reports,
                total: reports.length,
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get catch reports:', error);
            return {
                success: false,
                error: error.message,
                reports: []
            };
        }
    }

    // Create fishermen group
    async createFishermenGroup(groupData) {
        try {
            const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const group = {
                id: groupId,
                name: groupData.name,
                description: groupData.description,
                members: [groupData.createdBy], // Creator is first member
                location: groupData.location,
                radius: groupData.radius || 50,
                createdBy: groupData.createdBy,
                createdAt: new Date().toISOString(),
                isPublic: groupData.isPublic !== false
            };

            this.fishermenGroups.set(groupId, group);

            console.log(`👥 Fishermen group created: ${groupId}`);
            return {
                success: true,
                groupId: groupId,
                group: group
            };

        } catch (error) {
            console.error('❌ Failed to create fishermen group:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Join fishermen group
    async joinGroup(groupId, userId) {
        try {
            const group = this.fishermenGroups.get(groupId);
            
            if (!group) {
                throw new Error('Group not found');
            }

            if (!group.members.includes(userId)) {
                group.members.push(userId);
                this.fishermenGroups.set(groupId, group);
            }

            console.log(`👤 User ${userId} joined group ${groupId}`);
            return {
                success: true,
                groupId: groupId,
                members: group.members,
                memberCount: group.members.length
            };

        } catch (error) {
            console.error('❌ Failed to join group:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get groups for location
    async getGroupsForLocation(location, radiusKm = 50) {
        try {
            const groups = Array.from(this.fishermenGroups.values())
                .filter(group => {
                    if (!group.isPublic) return false;

                    if (location && group.location) {
                        const distance = this.calculateDistance(
                            location.lat, location.lng,
                            group.location.lat, group.location.lng
                        );
                        return distance <= radiusKm;
                    }

                    return true;
                })
                .sort((a, b) => b.members.length - a.members.length); // Sort by member count

            return {
                success: true,
                groups: groups,
                total: groups.length,
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get groups:', error);
            return {
                success: false,
                error: error.message,
                groups: []
            };
        }
    }

    // Send community alert
    async sendCommunityAlert(alertData) {
        try {
            const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const alert = {
                id: alertId,
                userId: alertData.userId,
                userName: alertData.userName,
                type: alertData.type,
                title: alertData.title,
                message: alertData.message,
                location: alertData.location,
                radius: alertData.radius || 50,
                priority: alertData.priority || 'MEDIUM',
                timestamp: new Date().toISOString(),
                expiresAt: alertData.expiresAt || new Date(Date.now() + 6 * 60 * 60 * 1000)
            };

            this.communityAlerts.set(alertId, alert);

            // Emit alert to affected users
            this.emit('communityAlert', alert);

            console.log(`📢 Community alert sent: ${alertId}`);
            return {
                success: true,
                alertId: alertId,
                alert: alert
            };

        } catch (error) {
            console.error('❌ Failed to send community alert:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get active community alerts
    async getCommunityAlerts(location, radiusKm = 50) {
        try {
            const alerts = Array.from(this.communityAlerts.values())
                .filter(alert => {
                    if (new Date(alert.expiresAt) <= new Date()) return false;

                    if (location && alert.location) {
                        const distance = this.calculateDistance(
                            location.lat, location.lng,
                            alert.location.lat, alert.location.lng
                        );
                        return distance <= (alert.radius || radiusKm);
                    }

                    return true;
                })
                .sort((a, b) => {
                    const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    return (priorityOrder[b.priority] - priorityOrder[a.priority]) || 
                           (new Date(b.timestamp) - new Date(a.timestamp));
                });

            return {
                success: true,
                alerts: alerts,
                total: alerts.length,
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get community alerts:', error);
            return {
                success: false,
                error: error.message,
                alerts: []
            };
        }
    }

    // Get community statistics
    async getCommunityStats(location = null, radiusKm = 50) {
        try {
            const totalPosts = Array.from(this.communityPosts.values()).length;
            const totalSafetyReports = Array.from(this.safetyReports.values()).length;
            const totalCatchReports = Array.from(this.catchReports.values()).length;
            const totalGroups = Array.from(this.fishermenGroups.values()).length;
            const activeAlerts = Array.from(this.communityAlerts.values()).filter(alert => 
                new Date(alert.expiresAt) > new Date()
            ).length;

            // Recent activity (last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentPosts = Array.from(this.communityPosts.values())
                .filter(post => new Date(post.timestamp) > oneDayAgo).length;
            const recentCatches = Array.from(this.catchReports.values())
                .filter(catchReport => new Date(catchReport.timestamp) > oneDayAgo).length;

            return {
                success: true,
                stats: {
                    totalPosts,
                    totalSafetyReports,
                    totalCatchReports,
                    totalGroups,
                    activeAlerts,
                    recentActivity: {
                        posts: recentPosts,
                        catches: recentCatches
                    }
                },
                location: location,
                radius: radiusKm
            };

        } catch (error) {
            console.error('❌ Failed to get community stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calculate distance between coordinates
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Clean up expired data
    cleanupExpiredData() {
        const now = new Date();

        // Clean expired posts
        for (const [postId, post] of this.communityPosts.entries()) {
            if (new Date(post.expiresAt) <= now) {
                this.communityPosts.delete(postId);
            }
        }

        // Clean expired safety reports
        for (const [reportId, report] of this.safetyReports.entries()) {
            if (new Date(report.expiresAt) <= now) {
                this.safetyReports.delete(reportId);
            }
        }

        // Clean expired alerts
        for (const [alertId, alert] of this.communityAlerts.entries()) {
            if (new Date(alert.expiresAt) <= now) {
                this.communityAlerts.delete(alertId);
            }
        }

        console.log('🧹 Cleaned up expired community data');
    }

    // Get all data (for debugging/admin)
    getAllData() {
        return {
            communityPosts: Array.from(this.communityPosts.values()),
            safetyReports: Array.from(this.safetyReports.values()),
            catchReports: Array.from(this.catchReports.values()),
            fishermenGroups: Array.from(this.fishermenGroups.values()),
            communityAlerts: Array.from(this.communityAlerts.values())
        };
    }
}

module.exports = CommunityFeatures;
