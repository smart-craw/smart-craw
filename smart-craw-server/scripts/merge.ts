import {  writeFileSync } from 'fs'
import RefParser from '@apidevtools/json-schema-ref-parser'
const bundled = await RefParser.bundle('./api_docs/websocket.yml')
writeFileSync('./api_docs/asyncapi.json', JSON.stringify(bundled, null, 2))
