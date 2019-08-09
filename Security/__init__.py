#!/usr/bin/env python
# -*- coding: utf-8 -*-

# ------------------------------------------------------------------
# Copyright (c) 2010-2019 Denis Machard
# This file is part of the extensive automation project
#
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
# MA 02110-1301 USA
# -------------------------------------------------------------------

from ea.sutadapters.Security.base64lib import BASE64
from ea.sutadapters.Security.basic import Basic
from ea.sutadapters.Security.digest import Digest
from ea.sutadapters.Security.wsse import Wsse
from ea.sutadapters.Security.hmac import Hmac
from ea.sutadapters.Security.oauth import Oauth
from ea.sutadapters.Security.certificate import Certificate
from ea.sutadapters.Security.jwt import JWT

__DESCRIPTION__ = """Security implementation"""