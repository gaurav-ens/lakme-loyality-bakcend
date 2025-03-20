import expres from 'express'
import { create,list,update,deleted,createSMSTemplate,createOrUpdateNotification } from './index'

const router = expres.Router()

// router.post('/create',create)
router.get('/list',list)
router.put('/update',update)
router.delete('/delete',deleted);
router.post('/createsmstemplate',createSMSTemplate);
router.post('/createOrUpdateNotification',createOrUpdateNotification);


export default router;