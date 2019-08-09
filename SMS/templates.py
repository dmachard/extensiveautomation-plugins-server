#!/usr/bin/env python
# -*- coding=utf-8 -*-

# -------------------------------------------------------------------
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

import sys

from ea.testexecutorlib import TestValidatorsLib as TestValidatorsLib
from ea.testexecutorlib import TestTemplatesLib as TestTemplatesLib
from ea.testexecutorlib import TestOperatorsLib as TestOperatorsLib
from ea.testexecutorlib import TestAdapterLib as TestAdapterLib

# templates for sms client
def sms(more=None, action=None, actionId=None, phone=None, msg=None, result=None, timestamp=None):
	"""
	Construct a template for a sms event
	"""
	tpl = TestTemplatesLib.TemplateLayer('SMS')

	# add additional keys
	if more is not None:
		tpl.addMore(more=more)
	
	if action is not None:
		tpl.addKey(name='action', data=action )

	if actionId is not None:
		tpl.addKey(name='action-id', data=actionId )
		
	if phone is not None:
		tpl.addKey(name='phone', data=phone )
		
	if msg is not None:
		tpl.addKey(name='msg', data=msg )
		
	if result is not None:
		tpl.addKey(name='result', data=result )
		
	if timestamp is not None:
		tpl.addKey(name='timestamp', data=timestamp )
		
	return tpl