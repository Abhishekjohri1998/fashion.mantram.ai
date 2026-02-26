import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User';
import Project from '../models/Project';
import ProjectUpload from '../models/ProjectUpload';
import TechPackDrawing from '../models/TechPackDrawing';
import MeasurementSession from '../models/MeasurementSession';
import CustomizationAsset from '../models/CustomizationAsset';
import SharedDeck from '../models/SharedDeck';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB.');

        // Storage for ID mapping: Supabase UUID -> MongoDB ObjectId
        const userMap: Record<string, any> = {};
        const projectMap: Record<string, any> = {};

        // 1. Migrate Users
        console.log('Fetching profiles...');
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
        if (profileError) throw profileError;

        for (const profile of profiles || []) {
            const email = profile.user_id ? `${profile.user_id}@legacy.com` : `user_${profile.id}@legacy.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name: profile.display_name || 'Legacy User',
                    email,
                    password: 'legacy_password_123',
                    displayName: profile.display_name,
                    avatarUrl: profile.photo_url,
                    bio: profile.bio,
                    companyName: profile.company_name,
                    logoUrl: profile.logo_url,
                    website: profile.website,
                } as any);
            }
            userMap[profile.id] = user._id;
            if (profile.user_id) userMap[profile.user_id] = user._id;
        }
        console.log(`Mapped ${Object.keys(userMap).length} users.`);

        // 2. Migrate Projects
        console.log('Fetching projects...');
        const { data: projects, error: projectError } = await supabase.from('projects').select('*');
        if (projectError) throw projectError;

        for (const p of projects || []) {
            const userId = userMap[p.user_id] || userMap[Object.keys(userMap)[0]];
            let mongoProject = await Project.findOne({ name: p.name, user: userId });
            if (!mongoProject) {
                mongoProject = await (Project as any).create({
                    name: p.name,
                    user: userId,
                    category: p.category,
                    status: p.status,
                    base_size: p.base_size,
                    size_system: p.size_system,
                    workflow_mode: p.workflow_mode,
                    base_measurements: p.base_measurements,
                });
            }
            projectMap[p.id] = mongoProject!._id;
        }
        console.log(`Migrated ${projects?.length || 0} projects.`);

        // 3. Migrate Project Uploads
        console.log('Fetching project uploads...');
        const { data: uploads, error: uploadError } = await supabase.from('project_uploads').select('*');
        if (!uploadError && uploads) {
            for (const u of uploads) {
                const pId = projectMap[u.project_id];
                const uId = userMap[u.user_id] || userMap[Object.keys(userMap)[0]];
                if (pId) {
                    await (ProjectUpload as any).findOneAndUpdate(
                        { file_path: u.file_path, project: pId },
                        {
                            project: pId,
                            user: uId,
                            label: u.label,
                            angle_key: u.angle_key,
                            file_path: u.file_path
                        },
                        { upsert: true }
                    );
                }
            }
            console.log(`Migrated ${uploads.length} uploads.`);
        }

        // 4. Migrate Measurement Sessions
        console.log('Fetching measurement sessions...');
        const { data: sessions, error: sessionError } = await supabase.from('body_measurement_sessions').select('*');
        if (!sessionError && sessions) {
            for (const s of sessions) {
                const pId = projectMap[s.project_id];
                const uId = userMap[s.user_id] || userMap[Object.keys(userMap)[0]];
                if (pId) {
                    await (MeasurementSession as any).create({
                        user: uId,
                        project: pId,
                        category: s.category,
                        height_cm: s.height_cm,
                        status: s.status,
                        measurements: s.measurements,
                        image_url: s.image_url
                    });
                }
            }
            console.log(`Migrated ${sessions.length} sessions.`);
        }

        // 5. Migrate Customization Assets
        console.log('Fetching customization assets...');
        const { data: assets, error: assetError } = await supabase.from('customization_assets').select('*');
        if (!assetError && assets) {
            for (const a of assets) {
                const pId = projectMap[a.project_id];
                const uId = userMap[a.user_id] || userMap[Object.keys(userMap)[0]];
                if (pId) {
                    await (CustomizationAsset as any).create({
                        project: pId,
                        user: uId,
                        asset_type: a.asset_type,
                        url: a.url,
                        metadata: a.metadata
                    });
                }
            }
            console.log(`Migrated ${assets.length} assets.`);
        }

        console.log('Migration successfully completed!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
